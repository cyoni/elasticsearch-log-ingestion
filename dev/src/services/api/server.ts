import type { Server } from "node:http";
import { createApp } from "./app";
import { closeClient } from "../../shared/elasticsearch/client";
import { disconnectProducer } from "./kafka/producer";

const PORT = Number(process.env.PORT!);
const HOST = process.env.HOST!;

if (!PORT || !HOST) {
  throw new Error("PORT and HOST must be set");
}

export async function startServer() {
  const app = createApp();

  const server = await new Promise<Server>((resolve, reject) => {
    const httpServer = app.listen(PORT, HOST, () => {
      console.log(`Server listening on http://${HOST}:${PORT}`);
      resolve(httpServer);
    });
    httpServer.on("error", reject);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}, shutting down...`);
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await disconnectProducer();
    await closeClient();
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });

  return server;
}

startServer().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
