import { createServerFn } from "@tanstack/react-start";
import { apiCall } from "./client.server";
import type { TADashboardResponse } from "../types/api";

export const getTADashboard = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<TADashboardResponse>("/api/v1/reports/ta-dashboard");
});
