import type { AccessLogDocument } from "@/types/elasticsearch";

export type AccessLogLine = {
  line: string;
  file: string;
  lineNumber: number;
};

export type ParsedAccessLog = AccessLogDocument | null;
