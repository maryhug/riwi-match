import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type { AIModelOut, AIPromptOut, GlobalSettingOut } from "../types/api";

export const getAIModels = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<{ models: AIModelOut[] }>("/api/v1/ai-config/models");
});

export const createAIModel = createServerFn({ method: "POST" })
  .validator(
    z.object({
      task_type: z.string(),
      provider: z.string(),
      model_name: z.string().min(1),
      api_key_secret_ref: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    return apiCall<AIModelOut>("/api/v1/ai-config/models", { method: "POST", body: data });
  });

export const activateAIModel = createServerFn({ method: "POST" })
  .validator(z.object({ modelId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<AIModelOut>(`/api/v1/ai-config/models/${data.modelId}/activate`, {
      method: "PATCH",
    });
  });

export const getAIPrompts = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<{ prompts: AIPromptOut[] }>("/api/v1/ai-config/prompts");
});

export const createAIPrompt = createServerFn({ method: "POST" })
  .validator(
    z.object({
      task_type: z.string(),
      version_name: z.string().min(1),
      system_prompt_text: z.string().min(1),
      activate: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    return apiCall<AIPromptOut>("/api/v1/ai-config/prompts", { method: "POST", body: data });
  });

export const activateAIPrompt = createServerFn({ method: "POST" })
  .validator(z.object({ promptId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<AIPromptOut>(`/api/v1/ai-config/prompts/${data.promptId}/activate`, {
      method: "PATCH",
    });
  });

export const getGlobalSettings = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<{ settings: GlobalSettingOut[] }>("/api/v1/ai-config/global-settings");
});

export const updateGlobalSetting = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string(), value: z.record(z.string(), z.unknown()) }))
  .handler(async ({ data }) => {
    return apiCall<GlobalSettingOut>(`/api/v1/ai-config/global-settings/${data.key}`, {
      method: "PATCH",
      body: { setting_value: data.value },
    });
  });
