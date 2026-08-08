import process from "node:process";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

// Cliente HTTP servidor-a-servidor hacia el backend FastAPI (cv-match-api).
// Corre solo en el Worker — el browser nunca ve la API_BASE_URL real ni los
// tokens JWT (viajan como cookies httpOnly, ver auth.functions.ts).

const ACCESS_COOKIE = "rm_access";
const REFRESH_COOKIE = "rm_refresh";
const USER_COOKIE = "rm_user";

function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? "http://localhost:8000";
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export interface SessionUser {
  id: string;
  name: string;
  last_name: string;
  email: string;
  role: "ADMIN" | "RECRUITER" | "TA_LEADER";
  status: "ACTIVE" | "SUSPENDED";
}

const isProduction = process.env.NODE_ENV === "production";

export function setSessionCookies(tokens: { access_token: string; refresh_token: string }): void {
  setCookie(ACCESS_COOKIE, tokens.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  setCookie(REFRESH_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function setSessionUserCookie(user: SessionUser): void {
  // No-httpOnly a propósito: solo es un hint de UI (nombre/rol a mostrar).
  // La autorización real siempre la valida el backend contra el JWT firmado.
  setCookie(USER_COOKIE, JSON.stringify(user), {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookies(): void {
  deleteCookie(ACCESS_COOKIE, { path: "/" });
  deleteCookie(REFRESH_COOKIE, { path: "/" });
  deleteCookie(USER_COOKIE, { path: "/" });
}

export function getAccessTokenCookie(): string | undefined {
  return getCookie(ACCESS_COOKIE);
}

export function getRefreshTokenCookie(): string | undefined {
  return getCookie(REFRESH_COOKIE);
}

export function getSessionUserCookie(): SessionUser | null {
  const raw = getCookie(USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

interface ApiCallOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** multipart/form-data en vez de JSON */
  formData?: FormData;
  /** Adjunta el access_token de la cookie como Bearer (default: true) */
  authenticated?: boolean;
  /** Token explícito a usar en vez de leer la cookie (ej. durante login/refresh) */
  tokenOverride?: string;
}

function formatApiDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const message = (item as { msg?: unknown }).msg;
          return typeof message === "string" ? message : null;
        }
        return null;
      })
      .filter((message): message is string => Boolean(message));
    if (messages.length > 0) return messages.join("; ");
  }

  if (detail && typeof detail === "object" && "message" in detail) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  return "La solicitud no pudo procesarse.";
}

async function rawApiCall<T>(path: string, opts: ApiCallOptions): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {};

  if (opts.authenticated !== false) {
    const token = opts.tokenOverride ?? getAccessTokenCookie();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail =
      isJson && payload && typeof payload === "object" && "detail" in payload
        ? formatApiDetail((payload as { detail: unknown }).detail)
        : `Error ${response.status}`;
    throw new ApiError(response.status, detail);
  }

  return payload as T;
}

/**
 * Llamada autenticada al backend. Si el access_token expiró (401), intenta
 * refrescar con el refresh_token de la cookie y reintenta una vez.
 */
export async function apiCall<T>(path: string, opts: ApiCallOptions = {}): Promise<T> {
  try {
    return await rawApiCall<T>(path, opts);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && opts.authenticated !== false) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return await rawApiCall<T>(path, { ...opts, tokenOverride: refreshed.access_token });
      }
    }
    throw err;
  }
}

async function tryRefresh(): Promise<{ access_token: string; refresh_token: string } | null> {
  const refreshToken = getRefreshTokenCookie();
  if (!refreshToken) return null;

  try {
    const tokens = await rawApiCall<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      role: string;
    }>("/api/v1/auth/refresh", {
      method: "POST",
      body: { refresh_token: refreshToken },
      authenticated: false,
    });
    setSessionCookies(tokens);
    return tokens;
  } catch {
    clearSessionCookies();
    return null;
  }
}
