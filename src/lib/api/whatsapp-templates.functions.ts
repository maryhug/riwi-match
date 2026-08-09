import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type { WhatsAppTemplateOut } from "../types/api";

export const getAdminWhatsAppTemplates = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<{ templates: WhatsAppTemplateOut[] }>("/api/v1/ai-config/whatsapp-templates");
});

export const getSelectableWhatsAppTemplates = createServerFn({ method: "GET" }).handler(
  async () => {
    return apiCall<{ templates: WhatsAppTemplateOut[] }>(
      "/api/v1/whatsapp-templates?selectable=true",
    );
  },
);

export const createWhatsAppTemplate = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1),
      language: z.string().min(2),
      body_text: z.string().min(10),
      header_text: z.string().nullable().optional(),
      footer_text: z.string().nullable().optional(),
      accept_button_text: z.string().min(1),
      reject_button_text: z.string().min(1),
      variable_bindings: z.record(z.string(), z.string()),
      variable_examples: z.record(z.string(), z.string()),
    }),
  )
  .handler(async ({ data }) => {
    return apiCall<WhatsAppTemplateOut>("/api/v1/ai-config/whatsapp-templates", {
      method: "POST",
      body: data,
    });
  });

export const syncWhatsAppTemplates = createServerFn({ method: "POST" }).handler(async () => {
  return apiCall<{ remote: number; created: number; updated: number }>(
    "/api/v1/ai-config/whatsapp-templates/sync",
    { method: "POST" },
  );
});

export const updateWhatsAppTemplate = createServerFn({ method: "POST" })
  .validator(
    z.object({
      templateId: z.string().uuid(),
      variable_bindings: z.record(z.string(), z.string()).optional(),
      is_enabled: z.boolean().optional(),
      is_default: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { templateId, ...body } = data;
    return apiCall<WhatsAppTemplateOut>(`/api/v1/ai-config/whatsapp-templates/${templateId}`, {
      method: "PATCH",
      body,
    });
  });
