export type AggregateQuery = {
  from: string;
  to: string;
  customer_name?: string;
};

export type AggregateResult = {
  customer_name: string;
  date: string;
  url: string;
  total_requests_size: number;
  requests_count: number;
};
