import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type { MatchStatusResponse, TriggerMatchResponse } from "../types/api";

export const triggerMatch = createServerFn({ method: "POST" })
  .validator(z.object({ processId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<TriggerMatchResponse>(`/api/v1/processes/${data.processId}/match`, {
      method: "POST",
    });
  });

export const getMatchStatus = createServerFn({ method: "GET" })
  .validator(z.object({ processId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<MatchStatusResponse>(`/api/v1/processes/${data.processId}/match/status`);
  });
