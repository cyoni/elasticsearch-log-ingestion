import { Client } from "@elastic/elasticsearch";

export const client = new Client({
  node: "http://127.0.0.1:9200",
  auth: {
    username: "elastic",
    password: "password",
  },
});
