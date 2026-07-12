import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type { QuestionIn, QuestionSetListResponse, QuestionSetOut } from "../types/api";

export const getQuestionSets = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<QuestionSetListResponse>("/api/v1/question-sets");
});

export const getQuestionSet = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<QuestionSetOut>(`/api/v1/question-sets/${data.id}`);
  });

export const createQuestionSet = createServerFn({ method: "POST" })
  .validator(z.object({ name: z.string().min(1), description: z.string().optional() }))
  .handler(async ({ data }) => {
    return apiCall<QuestionSetOut>("/api/v1/question-sets", {
      method: "POST",
      body: { name: data.name, description: data.description, questions: [] },
    });
  });

export const updateQuestionSet = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
      default_system_prompt: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { id, ...body } = data;
    return apiCall<QuestionSetOut>(`/api/v1/question-sets/${id}`, { method: "PATCH", body });
  });

export const deleteQuestionSet = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<void>(`/api/v1/question-sets/${data.id}`, { method: "DELETE" });
  });

export const addQuestion = createServerFn({ method: "POST" })
  .validator(
    z.object({
      setId: z.string(),
      text: z.string().min(1),
      type: z.enum(["OPEN", "CLOSED", "MULTIPLE_CHOICE", "YES_NO", "NUMERIC"]),
      expected_answer: z.string().nullable().optional(),
      positive_keywords: z.array(z.string()).optional(),
      risk_keywords: z.array(z.string()).optional(),
      weight: z.number().optional(),
      is_critical: z.boolean().optional(),
      eval_criteria: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { setId, ...body } = data;
    return apiCall<{ id: string; question_set_id: string }>(
      `/api/v1/question-sets/${setId}/questions`,
      { method: "POST", body: body satisfies QuestionIn },
    );
  });

export const updateQuestion = createServerFn({ method: "POST" })
  .validator(
    z.object({
      setId: z.string(),
      questionId: z.string(),
      text: z.string().optional(),
      type: z.enum(["OPEN", "CLOSED", "MULTIPLE_CHOICE", "YES_NO", "NUMERIC"]).optional(),
      expected_answer: z.string().nullable().optional(),
      positive_keywords: z.array(z.string()).optional(),
      risk_keywords: z.array(z.string()).optional(),
      weight: z.number().optional(),
      is_critical: z.boolean().optional(),
      eval_criteria: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { setId, questionId, ...body } = data;
    return apiCall<{ id: string; question_set_id: string }>(
      `/api/v1/question-sets/${setId}/questions/${questionId}`,
      { method: "PATCH", body },
    );
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .validator(z.object({ setId: z.string(), questionId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<void>(`/api/v1/question-sets/${data.setId}/questions/${data.questionId}`, {
      method: "DELETE",
    });
  });
