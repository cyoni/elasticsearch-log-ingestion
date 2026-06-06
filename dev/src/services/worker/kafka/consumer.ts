import { createKafkaClient } from "../../../shared/kafka/client";
import { getKafkaConfig } from "../../../shared/kafka/config";

export function createAccessLogsConsumer() {
  return createKafkaClient().consumer({
    groupId: getKafkaConfig().groupId,
  });
}
