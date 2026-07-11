import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type {
  CandidateDetailResponse,
  CandidateListResponse,
  OverrideCandidateRequest,
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

export const sendWhatsAppConsent = createServerFn({ method: "POST" })
  .validator(z.object({ processId: z.string(), pcId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<{ process_candidate_id: string; task_id: string; status: string }>(
      `/api/v1/processes/${data.processId}/candidates/${data.pcId}/whatsapp/send`,
      { method: "POST" },
    );
  });
