import type { Consumer } from "kafkajs";
import { createKafkaClient } from "../../../shared/kafka/client";
import { getKafkaConfig } from "../../../shared/kafka/config";

export function createAccessLogsConsumer(): Consumer {
  return createKafkaClient().consumer({
    groupId: getKafkaConfig().groupId,
  });
}
