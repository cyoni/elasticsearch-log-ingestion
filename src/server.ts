import type { Server } from "node:http";
import { createApp } from "@/app";
import { client } from "@/elasticsearch/client";
import { ensureAccessLogsIndex } from "@/elasticsearch/accessLogsIndex";

const PORT = Number(process.env.PORT ?? 8082);
const HOST = process.env.HOST ?? "0.0.0.0";

export async function startServer(): Promise<Server> {
  const created = await ensureAccessLogsIndex(client);
  if (created) {
    console.log('Created index "access-logs"');
  }

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
    await client.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  return server;
}

if (require.main === module) {
  startServer().catch((error: unknown) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
