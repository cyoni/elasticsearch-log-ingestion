import { ACCESS_LOGS_INDEX } from "../shared/constants/elasticsearch";
import { ensureAccessLogsIndex } from "../shared/elasticsearch/accessLogsIndex";
import { closeClient, getClient } from "../shared/elasticsearch/client";

async function main(): Promise<void> {
  const created = await ensureAccessLogsIndex(getClient());

  if (created) {
    console.log(`Created index "${ACCESS_LOGS_INDEX}"`);
  } else {
    console.log(`Index "${ACCESS_LOGS_INDEX}" already exists`);
  }

  const mapping = await getClient().indices.getMapping({
    index: ACCESS_LOGS_INDEX,
  });
  console.log(JSON.stringify(mapping, null, 2));

  await closeClient();
}

main().catch((error: unknown) => {
  console.error("Failed to create index:", error);
  process.exit(1);
});
