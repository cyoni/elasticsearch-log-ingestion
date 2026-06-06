import { Router } from "express";
import { ZodError } from "zod";
import { publishAccessLogBatch } from "../kafka/producer";
import { parseInsertBody } from "../schemas/insertBody";

export const insertRouter = Router();

insertRouter.post("/", async (req, res, next) => {
  try {
    const documents = parseInsertBody(req.body);
    await publishAccessLogBatch(documents);

    res.status(200).json({ accepted: documents.length });
  } catch (error) {
    if (error instanceof ZodError) {
      const { fieldErrors } = error.flatten();
      res.status(400).json({
        error: "Validation failed",
        details: fieldErrors,
      });
      return;
    }
    next(error);
  }
});
