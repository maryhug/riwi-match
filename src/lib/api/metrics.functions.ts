import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type { HomeMetricsResponse, MetricsDashboardResponse } from "../types/api";

export const getHomeMetrics = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<HomeMetricsResponse>("/api/v1/metrics/home");
});

export const getDashboardMetrics = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<MetricsDashboardResponse>("/api/v1/metrics/dashboard");
});

export const getProcessDashboardMetrics = createServerFn({ method: "GET" })
  .validator(z.object({ processId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return apiCall<MetricsDashboardResponse>(
      `/api/v1/metrics/dashboard?process_id=${encodeURIComponent(data.processId)}`,
    );
  });
