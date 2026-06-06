import type { Client, estypes } from "@elastic/elasticsearch";
import {
  ACCESS_LOG_FIELDS,
  ACCESS_LOGS_INDEX,
} from "../constants/elasticsearch";

export { ACCESS_LOGS_INDEX } from "../constants/elasticsearch";

export const accessLogsIndexDefinition: estypes.IndicesCreateRequest = {
  index: ACCESS_LOGS_INDEX,
  settings: {
    number_of_replicas: 0,
    "index.mapping.ignore_malformed": true,
  },
  mappings: {
    properties: {
      [ACCESS_LOG_FIELDS.TIMESTAMP]: {
        type: "date",
        format: "epoch_millis",
      },
      [ACCESS_LOG_FIELDS.CUSTOMER_NAME]: {
        type: "keyword",
      },
      [ACCESS_LOG_FIELDS.URL]: {
        type: "keyword",
      },
      [ACCESS_LOG_FIELDS.REQUEST_SIZE]: {
        type: "long",
      },
    },
  },
};

export async function ensureAccessLogsIndex(esClient: Client) {
  const exists = await esClient.indices.exists({ index: ACCESS_LOGS_INDEX });
  if (exists) {
    return false;
  }

  await esClient.indices.create(accessLogsIndexDefinition);
  return true;
}
