import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type {
  CandidateDetailResponse,
  CandidateListResponse,
  AnalyzeCVsResponse,
  OverrideCandidateRequest,
  UpdateCandidateAnalysisContextRequest,
  UploadCVsResponse,
} from "../types/api";

export const uploadCVs = createServerFn({ method: "POST" })
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
    const processId = data.get("processId");
    if (typeof processId !== "string") throw new Error("processId requerido");
    const form = new FormData();
    for (const file of data.getAll("files")) {
      form.append("files", file);
    }
    return apiCall<UploadCVsResponse>(`/api/v1/processes/${processId}/candidates/upload`, {
      method: "POST",
      formData: form,
    });
  });

export const analyzeCVs = createServerFn({ method: "POST" })
  .validator(z.object({ processId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<AnalyzeCVsResponse>(`/api/v1/processes/${data.processId}/candidates/analyze`, {
      method: "POST",
    });
  });

export const getCandidates = createServerFn({ method: "GET" })
  .validator(z.object({ processId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<CandidateListResponse>(`/api/v1/processes/${data.processId}/candidates`);
  });

export const getCandidateDetail = createServerFn({ method: "GET" })
  .validator(z.object({ processId: z.string(), pcId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<CandidateDetailResponse>(
      `/api/v1/processes/${data.processId}/candidates/${data.pcId}`,
    );
  });

export const overrideCandidate = createServerFn({ method: "POST" })
  .validator(
    z.object({
      processId: z.string(),
      pcId: z.string(),
      human_notes: z.string().nullable().optional(),
      human_override_match: z.number().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { processId, pcId, ...body } = data;
    return apiCall<{ status: string }>(
      `/api/v1/processes/${processId}/candidates/${pcId}/override`,
      { method: "PATCH", body: body satisfies OverrideCandidateRequest },
    );
  });

export const updateCandidateAnalysisContext = createServerFn({ method: "POST" })
  .validator(
    z.object({
      processId: z.string(),
      pcId: z.string(),
      analysis_context: z.string().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const { processId, pcId, ...body } = data;
    return apiCall<{ status: string; analysis_context: string | null }>(
      `/api/v1/processes/${processId}/candidates/${pcId}/analysis-context`,
      {
        method: "PATCH",
        body: body satisfies UpdateCandidateAnalysisContextRequest,
      },
    );
  });

export const sendWhatsAppConsent = createServerFn({ method: "POST" })
  .validator(z.object({ processId: z.string(), pcId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<{ process_candidate_id: string; task_id: string; status: string }>(
      `/api/v1/processes/${data.processId}/candidates/${data.pcId}/whatsapp/send`,
      { method: "POST" },
    );
  });

export const updateCandidate = createServerFn({ method: "POST" })
  .validator(
    z.object({
      processId: z.string(),
      pcId: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      city: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { processId, pcId, ...body } = data;
    return apiCall<{
      status: string;
      candidate: {
        process_candidate_id: string;
        name: string;
        email: string;
        phone?: string | null;
        city?: string | null;
      };
    }>(`/api/v1/processes/${processId}/candidates/${pcId}`, {
      method: "PATCH",
      body,
    });
  });

export const deleteCandidate = createServerFn({ method: "POST" })
  .validator(z.object({ processId: z.string(), pcId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<{ status: string; process_candidate_id: string }>(
      `/api/v1/processes/${data.processId}/candidates/${data.pcId}`,
      { method: "DELETE" },
    );
  });
