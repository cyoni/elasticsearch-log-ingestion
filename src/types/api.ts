import type { z } from "zod";
import { aggregateQuerySchema } from "@/schemas/aggregateQuery";
import type { AccessLogDocument } from "@/types/elasticsearch";

export type AggregateQuery = z.infer<typeof aggregateQuerySchema>;

export type InsertRequestBody = AccessLogDocument | AccessLogDocument[];

export type InsertResponse = {
  inserted: number;
};

export type AggregateResult = {
  customer_name: string;
  date: string;
  url: string;
  total_requests_size: number;
  requests_count: number;
};
