import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type {
  ProfilingAnswersResponse,
  ProfilingRunListResponse,
  ProfilingRunOut,
  TriggerProfilingResponse,
} from "../types/api";

export const triggerProfiling = createServerFn({ method: "POST" })
  .validator(z.object({ processId: z.string(), processCandidateIds: z.array(z.string()) }))
  .handler(async ({ data }) => {
    return apiCall<TriggerProfilingResponse>(
      `/api/v1/processes/${data.processId}/profiling/trigger`,
      { method: "POST", body: { process_candidate_ids: data.processCandidateIds } },
    );
  });

export const getProcessProfilingRuns = createServerFn({ method: "GET" })
  .validator(z.object({ processId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<ProfilingRunListResponse>(
      `/api/v1/processes/${data.processId}/profiling/runs`,
    );
  });

export const getAllProfilingRuns = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<ProfilingRunListResponse>("/api/v1/profiling/runs");
});

export const getProfilingRunDetail = createServerFn({ method: "GET" })
  .validator(z.object({ runId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<ProfilingRunOut>(`/api/v1/profiling/runs/${data.runId}`);
  });

export const getProfilingAnswers = createServerFn({ method: "GET" })
  .validator(z.object({ runId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<ProfilingAnswersResponse>(`/api/v1/profiling/runs/${data.runId}/answers`);
  });

export const cancelProfilingRun = createServerFn({ method: "POST" })
  .validator(z.object({ runId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<{ message: string }>(`/api/v1/profiling/runs/${data.runId}/cancel`, {
      method: "POST",
    });
  });

export const overrideProfiling = createServerFn({ method: "POST" })
  .validator(
    z.object({
      runId: z.string(),
      advancement_probability: z.enum(["HIGH", "MEDIUM", "LOW"]),
      advancement_explanation: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { runId, ...body } = data;
    return apiCall<ProfilingRunOut>(`/api/v1/profiling/runs/${runId}/override`, {
      method: "PATCH",
      body,
    });
  });
