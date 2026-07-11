import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiCall } from "./client.server";
import type { User } from "../types/api";

export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
  return apiCall<User[]>("/api/v1/users");
});

export const createUser = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1),
      last_name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(["ADMIN", "RECRUITER", "TA_LEADER"]),
    }),
  )
  .handler(async ({ data }) => {
    return apiCall<User>("/api/v1/users", { method: "POST", body: data });
  });

export const updateUser = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string(),
      name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().email().optional(),
      password: z.string().min(8).optional(),
      role: z.enum(["ADMIN", "RECRUITER", "TA_LEADER"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { userId, ...body } = data;
    return apiCall<User>(`/api/v1/users/${userId}`, { method: "PATCH", body });
  });

export const updateUserStatus = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string(), status: z.enum(["ACTIVE", "SUSPENDED"]) }))
  .handler(async ({ data }) => {
    return apiCall<User>(`/api/v1/users/${data.userId}/status`, {
      method: "PATCH",
      body: { status: data.status },
    });
  });

export const deleteUser = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    return apiCall<void>(`/api/v1/users/${data.userId}`, { method: "DELETE" });
  });

