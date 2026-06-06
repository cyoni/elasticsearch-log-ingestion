import { Router } from "express";
import { ZodError } from "zod";
import { parseInsertBody } from "@/schemas/insertBody";
import { insertDocuments } from "@/repositories/accessLogsRepository";

export const insertRouter = Router();

insertRouter.post("/", async (req, res, next) => {
  try {
    const documents = parseInsertBody(req.body);
    const inserted = await insertDocuments(documents);

    res.status(200).json({ inserted });
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
