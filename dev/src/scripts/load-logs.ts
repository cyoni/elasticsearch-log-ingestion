import { readdir } from "node:fs/promises";
import path from "node:path";
import type { OnDropDocument } from "@elastic/elasticsearch/lib/helpers";
import { parseAccessLogLine } from "../shared/accessLogs/parseAccessLogLine";
import { streamAccessLogLines } from "../shared/accessLogs/streamAccessLogLines";
import { ACCESS_LOGS_INDEX } from "../shared/constants/elasticsearch";
import { ensureAccessLogsIndex } from "../shared/elasticsearch/accessLogsIndex";
import { closeClient, getClient } from "../shared/elasticsearch/client";
import type { AccessLogDocument, AccessLogLine } from "../shared/types";

const ASSETS_DIR = path.resolve(__dirname, "../../../assets");
const PROGRESS_INTERVAL = 10_000;
const MAX_DROP_LOGS = 10;

async function listLogFiles(assetsDir: string) {
  const entries = await readdir(assetsDir);
  return entries
    .filter((name) => name.startsWith("access_") && name.endsWith(".log"))
    .sort()
    .map((name) => path.join(assetsDir, name));
}

async function prepareIndex() {
  const created = await ensureAccessLogsIndex(getClient());
  if (created) {
    console.log(`Created index "${ACCESS_LOGS_INDEX}"`);
  }
}

async function loadLogs() {
  const logFiles = await listLogFiles(ASSETS_DIR);
  if (logFiles.length === 0) {
    throw new Error(`No access_*.log files found in ${ASSETS_DIR}`);
  }

  console.log(`Loading ${logFiles.length} file(s) from ${ASSETS_DIR}`);
  for (const file of logFiles) {
    console.log(`  - ${path.basename(file)}`);
  }

  await prepareIndex();

  let linesRead = 0;
  let parsed = 0;
  let skipped = 0;
  let dropsLogged = 0;

  const logProgress = (entry: AccessLogLine) => {
    if (linesRead % PROGRESS_INTERVAL !== 0) {
      return;
    }
    console.log(
      `Progress: ${linesRead} lines read, ${parsed} parsed (${entry.file}:${entry.lineNumber})`,
    );
  };

  async function* logDocumentGenerator() {
    for await (const entry of streamAccessLogLines(logFiles)) {
      linesRead += 1;

      const document = parseAccessLogLine(entry.line);
      if (!document) {
        skipped += 1;
        continue;
      }

      parsed += 1;
      logProgress(entry);
      yield document;
    }
  }

  const onDrop = (drop: OnDropDocument<AccessLogDocument>) => {
    if (dropsLogged >= MAX_DROP_LOGS) {
      return;
    }
    dropsLogged += 1;
    console.error(
      `Dropped document (status ${drop.status}):`,
      drop.error?.reason ?? drop.error,
    );
  };

  const startedAt = Date.now();

  const bulkStats = await getClient().helpers.bulk({
    index: ACCESS_LOGS_INDEX,
    datasource: logDocumentGenerator(),
    onDocument: () => ({ index: {} }),
    flushBytes: 5_000_000,
    concurrency: 5,
    refreshOnCompletion: true,
    onDrop: onDrop,
  });

  const elapsedMs = Date.now() - startedAt;
  console.log(`time taken: ${elapsedMs}ms`);

  if (bulkStats.failed > 0 || bulkStats.aborted) {
    throw new Error("Bulk indexing completed with failures");
  }
}

async function main() {
  await loadLogs();
}

main()
  .catch((error: unknown) => {
    console.error("Failed to load logs:", error);
    process.exit(1);
  })
  .finally(async () => {
    await closeClient();
  });
