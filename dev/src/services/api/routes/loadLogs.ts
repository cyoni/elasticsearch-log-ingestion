import { Router } from "express";
import { loadLogs } from "../../../scripts/load-logs";

export const loadLogsRouter = Router();

loadLogsRouter.post("/", async (_req, res, next) => {
  try {
    await loadLogs();
    res.status(200).json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});
