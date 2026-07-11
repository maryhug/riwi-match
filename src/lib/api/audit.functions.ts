import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type { AuditLogListResponse } from "../types/api";

export const getAuditLogs = createServerFn({ method: "GET" })
  .validator(
    z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
      action: z.string().optional(),
      entity_type: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    if (data.limit != null) params.set("limit", String(data.limit));
    if (data.offset != null) params.set("offset", String(data.offset));
    if (data.action) params.set("action", data.action);
    if (data.entity_type) params.set("entity_type", data.entity_type);
    const qs = params.toString();
    return apiCall<AuditLogListResponse>(`/api/v1/audit-logs${qs ? `?${qs}` : ""}`);
  });
