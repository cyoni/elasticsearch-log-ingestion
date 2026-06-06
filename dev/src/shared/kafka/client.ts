import { Kafka } from "kafkajs";
import { getKafkaConfig } from "./config";

export function createKafkaClient() {
  const { clientId, brokers } = getKafkaConfig();
  return new Kafka({
    clientId,
    brokers,
  });
}
