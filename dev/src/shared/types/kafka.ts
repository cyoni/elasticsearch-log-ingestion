import type { AccessLogDocument } from "./elasticsearch";

export type AccessLogDocumentIdParams = {
  topic: string;
  partition: number;
  offset: string;
  docIndex: number;
};

export type BufferedBatch = {
  documents: AccessLogDocument[];
  resolveOffsets: Array<() => void>;
};