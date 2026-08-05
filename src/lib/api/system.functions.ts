import { createServerFn } from "@tanstack/react-start";
import { apiCall } from "./client.server";
import type { IntegrationHealthResponse } from "../types/api";

export const getIntegrationsHealth = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<IntegrationHealthResponse>("/api/v1/system/integrations-health");
});
