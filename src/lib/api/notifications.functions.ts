import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type { NotificationsListResponse } from "../types/api";

export const getNotifications = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<NotificationsListResponse>("/api/v1/notifications");
});

export const markNotificationRead = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<{ status: string; id: string }>(`/api/v1/notifications/${data.id}/read`, {
      method: "PATCH",
    });
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" }).handler(async () => {
  return apiCall<{ status: string; updated_count: number }>("/api/v1/notifications/read-all", {
    method: "POST",
  });
});
