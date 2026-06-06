import { ACCESS_LOGS_INDEX } from "@/constants/elasticsearch";
import { client } from "@/elasticsearch/client";
import { ensureAccessLogsIndex } from "@/elasticsearch/accessLogsIndex";

async function main(): Promise<void> {
  const created = await ensureAccessLogsIndex(client);

  if (created) {
    console.log(`Created index "${ACCESS_LOGS_INDEX}"`);
  } else {
    console.log(`Index "${ACCESS_LOGS_INDEX}" already exists`);
  }

  const mapping = await client.indices.getMapping({ index: ACCESS_LOGS_INDEX });
  console.log(JSON.stringify(mapping, null, 2));

  await client.close();
}

main().catch((error: unknown) => {
  console.error("Failed to create index:", error);
  process.exit(1);
});
