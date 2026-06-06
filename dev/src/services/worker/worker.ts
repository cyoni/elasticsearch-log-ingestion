import { closeClient } from "../../shared/elasticsearch/client";
import { startAccessLogsConsumer } from "./accessLogsConsumer";

export async function startWorker() {
  const consumer = await startAccessLogsConsumer();
  console.log("Access logs worker started");

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down worker...`);
    await consumer.disconnect();
    await closeClient();
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });
}

startWorker().catch((error: unknown) => {
  console.error("Failed to start worker:", error);
  process.exit(1);
});
