import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type {
  CreateJDResponse,
  CreateProcessRequest,
  JobDescriptionListResponse,
  ParseJDResponse,
  ProcessDetailResponse,
  ProcessListResponse,
  ProcessMetricsResponse,
  ProcessMutationResponse,
  UploadJDResponse,
  VoiceConfig,
} from "../types/api";
import type { ProcessStatus } from "../types/enums";

export const getProcesses = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<ProcessListResponse>("/api/v1/processes");
});

export const getProcess = createServerFn({ method: "GET" })
  .validator(z.object({ processId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<ProcessDetailResponse>(`/api/v1/processes/${data.processId}`);
  });

export const createProcess = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1),
      job_title: z.string().min(1),
      area: z.string().min(1),
      seniority: z.string().min(1),
      budget_max_usd: z.number().optional(),
      match_weights_override: z
        .object({
          technical_skills: z.number(),
          relevant_experience: z.number(),
          seniority: z.number(),
          industry_domain: z.number(),
          languages: z.number(),
          education_certifications: z.number(),
        })
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    return apiCall<ProcessMutationResponse>("/api/v1/processes", {
      method: "POST",
      body: data satisfies CreateProcessRequest,
    });
  });

export const updateProcess = createServerFn({ method: "POST" })
  .validator(
    z.object({
      processId: z.string(),
      name: z.string().optional(),
      job_title: z.string().optional(),
      area: z.string().optional(),
      seniority: z.string().optional(),
      budget_max_usd: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { processId, ...body } = data;
    return apiCall<ProcessMutationResponse>(`/api/v1/processes/${processId}`, {
      method: "PATCH",
      body,
    });
  });

export const updateProcessStatus = createServerFn({ method: "POST" })
  .validator(z.object({ processId: z.string(), status: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<{ process_id: string; status: ProcessStatus }>(
      `/api/v1/processes/${data.processId}/status`,
      { method: "PATCH", body: { status: data.status } },
    );
  });

export const assignQuestionSet = createServerFn({ method: "POST" })
  .validator(z.object({ processId: z.string(), questionSetId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<{ process_id: string; question_set_id: string }>(
      `/api/v1/processes/${data.processId}/question-set`,
      { method: "PATCH", body: { question_set_id: data.questionSetId } },
    );
  });

export const updateVoiceConfig = createServerFn({ method: "POST" })
  .validator(
    z.object({
      processId: z.string(),
      voice_override_agent_id: z.string().nullable().optional(),
      voice_override_system_prompt: z.string().nullable().optional(),
      voice_override_first_message: z.string().nullable().optional(),
      voice_override_language: z.string().nullable().optional(),
      voice_override_llm_model: z.string().nullable().optional(),
      voice_override_voice_id: z.string().nullable().optional(),
      voice_override_tts_stability: z.number().nullable().optional(),
      voice_override_tts_speed: z.number().nullable().optional(),
      voice_override_tts_similarity_boost: z.number().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { processId, ...body } = data;
    return apiCall<VoiceConfig>(`/api/v1/processes/${processId}/voice-config`, {
      method: "PATCH",
      body,
    });
  });

export const createJobDescription = createServerFn({ method: "POST" })
  .validator(z.object({ processId: z.string(), jdRawText: z.string().min(10) }))
  .handler(async ({ data }) => {
    return apiCall<CreateJDResponse>(`/api/v1/processes/${data.processId}/job-description`, {
      method: "POST",
      body: { jd_raw_text: data.jdRawText },
    });
  });

export const parseJobDescription = createServerFn({ method: "POST" })
  .validator(z.object({ processId: z.string(), jdRawText: z.string().min(1) }))
  .handler(async ({ data }) => {
    return apiCall<ParseJDResponse>(`/api/v1/processes/${data.processId}/job-description/parse`, {
      method: "POST",
      body: { jd_raw_text: data.jdRawText },
    });
  });

export const getJobDescriptions = createServerFn({ method: "GET" })
  .validator(z.object({ processId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<JobDescriptionListResponse>(
      `/api/v1/processes/${data.processId}/job-descriptions`,
    );
  });

export const uploadJobDescription = createServerFn({ method: "POST" })
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
    const processId = data.get("processId");
    if (typeof processId !== "string") throw new Error("processId requerido");
    const form = new FormData();
    const file = data.get("file");
    if (file) form.append("file", file);
    return apiCall<UploadJDResponse>(`/api/v1/processes/${processId}/job-description/upload`, {
      method: "POST",
      formData: form,
    });
  });

export const getProcessMetrics = createServerFn({ method: "GET" })
  .validator(z.object({ processId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<ProcessMetricsResponse>(`/api/v1/processes/${data.processId}/metrics`);
  });
