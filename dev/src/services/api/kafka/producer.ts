import { CompressionTypes, type Producer } from "kafkajs";
import { ACCESS_LOG_FIELDS } from "../../../shared/constants/elasticsearch";
import { createKafkaClient } from "../../../shared/kafka/client";
import { getKafkaConfig } from "../../../shared/kafka/config";
import type { AccessLogBatchMessage } from "../../../shared/kafka/messages";
import type { AccessLogDocument } from "../../../shared/types/elasticsearch";

let producer: Producer | null = null;
let connectPromise: Promise<void> | null = null;

async function getProducer() {
  if (!producer) {
    producer = createKafkaClient().producer();
  }

  if (!connectPromise) {
    connectPromise = producer.connect();
  }

  await connectPromise;
  return producer;
}

export async function publishAccessLogBatch(documents: AccessLogDocument[]) {
  const activeProducer = await getProducer();
  const message: AccessLogBatchMessage = { documents };

  await activeProducer.send({
    topic: getKafkaConfig().topic,
    compression: CompressionTypes.GZIP,
    messages: [{ value: JSON.stringify(message) }],
  });
}

export async function disconnectProducer() {
  if (!producer) {
    return;
  }

  await producer.disconnect();
  producer = null;
  connectPromise = null;
}
