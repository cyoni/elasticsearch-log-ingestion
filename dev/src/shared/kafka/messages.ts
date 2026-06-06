import type { AccessLogDocument } from "../types/elasticsearch";

export type AccessLogBatchMessage = {
  documents: AccessLogDocument[];
};

export function parseAccessLogBatchMessage(
  value: Buffer | null,
): AccessLogBatchMessage {
  if (!value) {
    throw new Error("Kafka message value is empty");
  }

  const parsed: unknown = JSON.parse(value.toString("utf8"));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("documents" in parsed) ||
    !Array.isArray((parsed as AccessLogBatchMessage).documents)
  ) {
    throw new Error("Invalid access log batch message format");
  }

  return parsed as AccessLogBatchMessage;
}
