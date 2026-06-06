export function getKafkaConfig() {
  return {
    brokers: process.env.KAFKA_BROKERS!.split(","),
    clientId: process.env.KAFKA_CLIENT_ID!,
    groupId: process.env.KAFKA_GROUP_ID!,
    topic: process.env.KAFKA_TOPIC_ACCESS_LOGS!,
  };
}
