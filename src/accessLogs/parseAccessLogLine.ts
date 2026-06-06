import { ACCESS_LOG_FIELDS } from "@/constants/elasticsearch";
import type { AccessLogDocument, ParsedAccessLog } from "@/types";

const TIMESTAMP_INDEX = 0;
const REQUEST_SIZE_INDEX = 4;
const URL_INDEX = 6;
const CUSTOMER_NAME_INDEX = 7;
const MIN_PARTS = CUSTOMER_NAME_INDEX + 1;

export function getUrlHostname(raw: string): string {
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      return new URL(raw).hostname;
    } catch {
      return raw;
    }
  }

  const colonIndex = raw.lastIndexOf(":");
  if (colonIndex > 0) {
    const port = raw.slice(colonIndex + 1);
    if (/^\d+$/.test(port)) {
      return raw.slice(0, colonIndex);
    }
  }

  return raw;
}

export function parseAccessLogLine(line: string): ParsedAccessLog {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length < MIN_PARTS) {
    return null;
  }

  const timestampSeconds = Number.parseFloat(parts[TIMESTAMP_INDEX]);
  const requestSize = Number.parseInt(parts[REQUEST_SIZE_INDEX], 10);

  if (!Number.isFinite(timestampSeconds) || !Number.isFinite(requestSize)) {
    return null;
  }

  const customerName = parts[CUSTOMER_NAME_INDEX];
  const url = getUrlHostname(parts[URL_INDEX]);

  if (!customerName || !url) {
    return null;
  }

  return {
    [ACCESS_LOG_FIELDS.TIMESTAMP]: Math.round(timestampSeconds * 1000),
    [ACCESS_LOG_FIELDS.REQUEST_SIZE]: requestSize,
    [ACCESS_LOG_FIELDS.URL]: url,
    [ACCESS_LOG_FIELDS.CUSTOMER_NAME]: customerName,
  };
}
