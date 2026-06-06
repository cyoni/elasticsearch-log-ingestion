import type { AccessLogDocument } from "../../shared/types/elasticsearch";

export type InsertRequestBody = AccessLogDocument | AccessLogDocument[];

export type InsertResponse = {
  accepted: number;
};
