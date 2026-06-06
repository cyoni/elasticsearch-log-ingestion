import { ACCESS_LOG_FIELDS } from "@/constants/elasticsearch";

export type AccessLogField =
  (typeof ACCESS_LOG_FIELDS)[keyof typeof ACCESS_LOG_FIELDS];

export type AccessLogDocument = {
  [ACCESS_LOG_FIELDS.TIMESTAMP]: number;
  [ACCESS_LOG_FIELDS.CUSTOMER_NAME]: string;
  [ACCESS_LOG_FIELDS.URL]: string;
  [ACCESS_LOG_FIELDS.REQUEST_SIZE]: number;
};
