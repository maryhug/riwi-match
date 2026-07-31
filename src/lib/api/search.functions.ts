import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type { GlobalSearchResponse } from "../types/api";

export const globalSearch = createServerFn({ method: "GET" })
  .validator(z.object({ query: z.string().min(2).max(100), limit: z.number().optional(), offset: z.number().optional() }))
  .handler(async ({ data }) => {
    const params = new URLSearchParams({ q: data.query });
    if (data.limit != null) params.set("limit", String(data.limit));
    if (data.offset != null) params.set("offset", String(data.offset));
    return apiCall<GlobalSearchResponse>(`/api/v1/search?${params}`);
  });
