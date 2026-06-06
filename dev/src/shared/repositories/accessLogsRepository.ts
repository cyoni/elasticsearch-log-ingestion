import type { estypes } from "@elastic/elasticsearch";
import {
  ACCESS_LOG_FIELDS,
  ACCESS_LOGS_INDEX,
} from "../constants/elasticsearch";
import { getClient } from "../elasticsearch/client";
import type {
  AccessLogDocument,
  AggregateQuery,
  AggregateResult,
  IdempotentAccessLogDocument,
} from "../types";

const BULK_FLUSH_BYTES = 5_000_000;
const BULK_CONCURRENCY = 5;
const INSERT_MAX_ATTEMPTS = 3;
const INSERT_RETRY_BASE_DELAY_MS = 1_000;

type CompositeBucket = estypes.AggregationsCompositeBucket & {
  key: {
    customer_name: string;
    date: string;
    url: string;
  };
  total_requests_size: estypes.AggregationsSumAggregate;
};

function buildFilterQuery(query: AggregateQuery) {
  const filters: estypes.QueryDslQueryContainer[] = [
    {
      range: {
        [ACCESS_LOG_FIELDS.TIMESTAMP]: {
          gte: query.from,
          lt: `${query.to}||+1d/d`,
          format: "yyyy-MM-dd",
        },
      },
    },
  ];

  if (query.customer_name) {
    filters.push({
      term: {
        [ACCESS_LOG_FIELDS.CUSTOMER_NAME]: query.customer_name,
      },
    });
  }

  return {
    bool: {
      filter: filters,
    },
  };
}

function buildAggregation(after?: estypes.AggregationsCompositeAggregateKey) {
  const composite: estypes.AggregationsCompositeAggregation = {
    size: 10_000,
    sources: [
      {
        customer_name: {
          terms: {
            field: ACCESS_LOG_FIELDS.CUSTOMER_NAME,
          },
        },
      },
      {
        date: {
          date_histogram: {
            field: ACCESS_LOG_FIELDS.TIMESTAMP,
            calendar_interval: "day",
            format: "yyyy-MM-dd",
          },
        },
      },
      {
        url: {
          terms: {
            field: ACCESS_LOG_FIELDS.URL,
          },
        },
      },
    ],
  };

  if (after) {
    composite.after = after;
  }

  return {
    composite,
    aggs: {
      total_requests_size: {
        sum: {
          field: ACCESS_LOG_FIELDS.REQUEST_SIZE,
        },
      },
    },
  };
}

type InsertDocumentsOptions = {
  onRetry?: () => Promise<void>;
};

export async function insertDocuments(
  documents: AccessLogDocument[],
  options?: InsertDocumentsOptions,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= INSERT_MAX_ATTEMPTS; attempt++) {
    try {
      const stats = await getClient().helpers.bulk({
        index: ACCESS_LOGS_INDEX,
        datasource: documents,
    onDocument: () => ({ index: {} }),
        flushBytes: BULK_FLUSH_BYTES,
        concurrency: BULK_CONCURRENCY,
      });

      if (stats.failed > 0 || stats.aborted) {
        throw new Error(
          `Bulk indexing failed: ${stats.failed} failed, aborted: ${stats.aborted}`,
        );
      }

      return stats.successful;
    } catch (error) {
      lastError = error;
      if (attempt === INSERT_MAX_ATTEMPTS) {
        break;
      }

      console.warn(
        `Bulk insert failed (attempt ${attempt}/${INSERT_MAX_ATTEMPTS})`,
        error,
      );
      await options?.onRetry?.();
    }
  }

  throw lastError;
}

export async function aggregateData(
  query: AggregateQuery,
): Promise<AggregateResult[]> {
  const results: AggregateResult[] = [];
  let after: estypes.AggregationsCompositeAggregateKey | undefined;
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await getClient().search<
      unknown,
      { by_customer_date_url: estypes.AggregationsCompositeAggregate }
    >({
      index: ACCESS_LOGS_INDEX,
      size: 0,
      query: buildFilterQuery(query),
      aggs: {
        by_customer_date_url: buildAggregation(after),
      },
    });

    const aggregation = response.aggregations?.by_customer_date_url;
    if (!aggregation) {
      break;
    }

    for (const bucket of aggregation.buckets as CompositeBucket[]) {
      results.push({
        customer_name: bucket.key.customer_name,
        date: bucket.key.date,
        url: bucket.key.url,
        total_requests_size: bucket.total_requests_size.value ?? 0,
        requests_count: bucket.doc_count,
      });
    }

    after = aggregation.after_key;
    hasMorePages = !!after;
  }

  return results;
}
