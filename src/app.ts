import express, { type Express } from "express";
import { aggregateRouter } from "@/routes/aggregate";
import { insertRouter } from "@/routes/insert";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "10mb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/insert", insertRouter);
  app.use("/aggregate", aggregateRouter);


  return app;
}
