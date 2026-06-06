import type { EachBatchPayload } from "kafkajs";
import { getKafkaConfig } from "../../shared/kafka/config";
import { parseAccessLogBatchMessage } from "../../shared/kafka/messages";
import { insertDocuments } from "../../shared/repositories/accessLogsRepository";
import type { AccessLogDocument } from "../../shared/types/elasticsearch";
import { createAccessLogsConsumer } from "./kafka/consumer";

const BUFFER_MAX_DOCS = 5_000;
const BUFFER_MAX_BYTES = 5_000_000;

type BufferedBatch = {
  documents: AccessLogDocument[];
  resolveOffsets: Array<() => void>;
};

function estimateDocumentBytes(document: AccessLogDocument): number {
  return Buffer.byteLength(JSON.stringify(document), "utf8");
}

async function flushBuffer(
  buffer: BufferedBatch,
  heartbeat: () => Promise<void>,
) {
  if (buffer.documents.length === 0) {
    return;
  }

  await insertDocuments(buffer.documents);
  for (const resolveOffset of buffer.resolveOffsets) {
    resolveOffset();
  }
  buffer.documents = [];
  buffer.resolveOffsets = [];
  await heartbeat(); // tell the broker that the consumer is still alive
}

async function handleBatch({
  batch,
  resolveOffset,
  heartbeat,
  isRunning,
  isStale,
}: EachBatchPayload) {
  const buffer: BufferedBatch = {
    documents: [],
    resolveOffsets: [],
  };
  let bufferBytes = 0;

  for (const message of batch.messages) {
    if (isStale()) {
      // the batch is stale in case of rebalance/something moved the offset
      break;
    }
    if (!isRunning()) {
      // the consumer is dead
      break;
    }

    try {
      const { documents } = parseAccessLogBatchMessage(message.value);
      buffer.documents.push(...documents);
      bufferBytes += documents.reduce(
        (total, document) => total + estimateDocumentBytes(document),
        0,
      );
      buffer.resolveOffsets.push(() => {
        resolveOffset(message.offset);
      });
    } catch (error) {
      console.error(
        `Skipping invalid message at ${batch.topic}[${batch.partition}] offset ${message.offset}:`,
        error,
      );
      resolveOffset(message.offset);
      await heartbeat();
      continue;
    }

    const shouldFlush =
      buffer.documents.length >= BUFFER_MAX_DOCS ||
      bufferBytes >= BUFFER_MAX_BYTES;

    if (shouldFlush) {
      await flushBuffer(buffer, heartbeat);
      bufferBytes = 0;
    }
  }

  await flushBuffer(buffer, heartbeat);
}

export async function startAccessLogsConsumer() {
  const consumer = createAccessLogsConsumer();
  await consumer.connect();

  await consumer.subscribe({
    topic: getKafkaConfig().topic,
  });

  await consumer.run({
    eachBatchAutoResolve: false,
    eachBatch: handleBatch,
  });

  return consumer;
}
