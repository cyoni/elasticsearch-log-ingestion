import { Router } from "express";
import { ZodError } from "zod";
import { aggregateData } from "../../../shared/repositories/accessLogsRepository";
import { parseQuery } from "../schemas/aggregateQuery";

export const aggregateRouter = Router();

aggregateRouter.get("/", async (req, res, next) => {
  try {
    const query = parseQuery(req.query);
    const results = await aggregateData(query);

    res.status(200).json(results);
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
