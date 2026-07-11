import { createServerFn } from "@tanstack/react-start";
import { apiCall } from "./client.server";
import type { MetricsDashboardResponse } from "../types/api";

export const getDashboardMetrics = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<MetricsDashboardResponse>("/api/v1/metrics/dashboard");
});
