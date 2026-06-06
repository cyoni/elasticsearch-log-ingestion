import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date in YYYY-MM-DD format");

export const aggregateQuerySchema = z
  .object({
    from: dateSchema,
    to: dateSchema,
    customer_name: z.string().min(1).optional(),
  })
  .refine((data) => data.from <= data.to, {
    message: "'from' must be on or before 'to'",
    path: ["to"],
  });

function queryValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

export function parseQuery(
  query: Record<string, unknown>,
): z.infer<typeof aggregateQuerySchema> {
  return aggregateQuerySchema.parse({
    from: queryValue(query.from),
    to: queryValue(query.to),
    customer_name: queryValue(query.customer_name),
  });
}
