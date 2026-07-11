import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";

export const submitFeedback = createServerFn({ method: "POST" })
  .validator(
    z.object({
      processCandidateId: z.string(),
      context: z.enum(["MATCH", "PROFILING"]),
      evaluation: z.enum(["CORRECT", "PARTIAL", "INCORRECT"]),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    return apiCall<{ message: string }>("/api/v1/feedback", {
      method: "POST",
      body: {
        process_candidate_id: data.processCandidateId,
        context: data.context,
        evaluation: data.evaluation,
        notes: data.notes,
      },
    });
  });
