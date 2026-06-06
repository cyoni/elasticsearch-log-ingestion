import { z } from "zod";
import { ACCESS_LOG_FIELDS } from "@/constants/elasticsearch";
import type { AccessLogDocument } from "@/types/elasticsearch";

const MAX_BATCH_SIZE = 10_000;

const accessLogDocumentSchema = z.object({
  [ACCESS_LOG_FIELDS.TIMESTAMP]: z.number().int().positive(),
  [ACCESS_LOG_FIELDS.CUSTOMER_NAME]: z.string().min(1),
  [ACCESS_LOG_FIELDS.URL]: z.string().min(1),
  [ACCESS_LOG_FIELDS.REQUEST_SIZE]: z.number().int().nonnegative(),
}) satisfies z.ZodType<AccessLogDocument>;

const accessLogDocumentArraySchema = z
  .array(accessLogDocumentSchema)
  .min(1)
  .max(MAX_BATCH_SIZE);

export const insertBodySchema = z.union([
  accessLogDocumentSchema,
  accessLogDocumentArraySchema,
]);

export function parseInsertBody(body: unknown): AccessLogDocument[] {
  const parsed = insertBodySchema.parse(body);
  return Array.isArray(parsed) ? parsed : [parsed];
}
