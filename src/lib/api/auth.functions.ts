import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  ApiError,
  apiCall,
  clearSessionCookies,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  getSessionUserCookie,
  setSessionCookies,
  setSessionUserCookie,
  type SessionUser,
} from "./client.server";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
}

export const login = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      const tokens = await apiCall<TokenResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { email: data.email, password: data.password },
        authenticated: false,
      });
      setSessionCookies(tokens);

      const user = await apiCall<SessionUser>("/api/v1/users/me", {
        tokenOverride: tokens.access_token,
      });
      setSessionUserCookie(user);

      return { user };
    } catch (err) {
      if (err instanceof ApiError) {
        return { error: err.detail };
      }
      return { error: "No se pudo conectar con el servidor." };
    }
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const refreshToken = getRefreshTokenCookie();
  if (refreshToken) {
    try {
      await apiCall("/api/v1/auth/logout", {
        method: "POST",
        body: { refresh_token: refreshToken },
        authenticated: false,
      });
    } catch {
      // Si el logout en el backend falla (token ya vencido, etc.) igual
      // limpiamos las cookies locales — no queremos dejar al usuario atascado.
    }
  }
  clearSessionCookies();
  return { ok: true };
});

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const hasAccessToken = Boolean(getAccessTokenCookie());
  const user = getSessionUserCookie();
  return { user, isAuthenticated: hasAccessToken && user !== null };
});
