import { randomBytes, timingSafeEqual } from "node:crypto";
import process from "node:process";
import { getApiBaseUrl, type SessionUser } from "./api/client.server";

const STATE_COOKIE = "rm_orbita_sso_state";
const ACCESS_COOKIE = "rm_access";
const REFRESH_COOKIE = "rm_refresh";
const USER_COOKIE = "rm_user";
const STATE_TTL_SECONDS = 5 * 60;

interface OrbitaSessionResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  session_expires_in: number;
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function serializeCookie(
  name: string,
  value: string,
  options: { maxAge: number; httpOnly: boolean },
): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const httpOnly = options.httpOnly ? "; HttpOnly" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${options.maxAge}; SameSite=Lax${secure}${httpOnly}`;
}

function expiredCookie(name: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}; HttpOnly`;
}

function equalState(received: string | null, expected: string | null): boolean {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function redirect(request: Request, path: string, cookies: string[] = []): Response {
  const location = new URL(path, request.url);
  const headers = new Headers({ Location: location.toString(), "Cache-Control": "no-store" });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function errorRedirect(request: Request, error: string): Response {
  const location = new URL("/", request.url);
  location.searchParams.set("error", error);
  return redirect(request, location.pathname + location.search, [expiredCookie(STATE_COOKIE)]);
}

function errorCodeForStatus(status: number): string {
  if (status === 403) return "orbita_access_denied";
  if (status === 409) return "orbita_account_conflict";
  if (status === 503) return "orbita_unavailable";
  return "orbita_authentication_failed";
}

async function startOrbitaLogin(request: Request): Promise<Response> {
  const state = randomBytes(32).toString("base64url");
  try {
    const endpoint = new URL("/api/v1/auth/orbita/authorize-url", getApiBaseUrl());
    endpoint.searchParams.set("state", state);
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      redirect: "manual",
    });
    if (!response.ok) return errorRedirect(request, errorCodeForStatus(response.status));
    const payload = (await response.json()) as { authorization_url?: unknown };
    if (typeof payload.authorization_url !== "string") {
      return errorRedirect(request, "orbita_authentication_failed");
    }
    const authorizationUrl = new URL(payload.authorization_url);
    const headers = new Headers({
      Location: authorizationUrl.toString(),
      "Cache-Control": "no-store",
    });
    headers.append(
      "Set-Cookie",
      serializeCookie(STATE_COOKIE, state, { maxAge: STATE_TTL_SECONDS, httpOnly: true }),
    );
    return new Response(null, { status: 302, headers });
  } catch {
    return errorRedirect(request, "orbita_unavailable");
  }
}

async function completeOrbitaLogin(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = parseCookie(request.headers.get("cookie"), STATE_COOKIE);
  if (!code || !equalState(state, expectedState)) {
    return errorRedirect(request, "orbita_invalid_state");
  }

  try {
    const exchangeResponse = await fetch(new URL("/api/v1/auth/orbita/exchange", getApiBaseUrl()), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ code }),
      redirect: "manual",
    });
    if (!exchangeResponse.ok) {
      return errorRedirect(request, errorCodeForStatus(exchangeResponse.status));
    }
    const tokens = (await exchangeResponse.json()) as OrbitaSessionResponse;
    if (
      typeof tokens.access_token !== "string" ||
      typeof tokens.refresh_token !== "string" ||
      !Number.isInteger(tokens.expires_in) ||
      !Number.isInteger(tokens.session_expires_in) ||
      tokens.expires_in <= 0 ||
      tokens.session_expires_in <= 0
    ) {
      return errorRedirect(request, "orbita_authentication_failed");
    }

    const profileResponse = await fetch(new URL("/api/v1/users/me", getApiBaseUrl()), {
      headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" },
      redirect: "manual",
    });
    if (!profileResponse.ok) {
      return errorRedirect(request, "orbita_authentication_failed");
    }
    const user = (await profileResponse.json()) as SessionUser;
    const accessMaxAge = Math.min(tokens.expires_in, tokens.session_expires_in);
    return redirect(request, "/app", [
      expiredCookie(STATE_COOKIE),
      serializeCookie(ACCESS_COOKIE, tokens.access_token, {
        maxAge: accessMaxAge,
        httpOnly: true,
      }),
      serializeCookie(REFRESH_COOKIE, tokens.refresh_token, {
        maxAge: tokens.session_expires_in,
        httpOnly: true,
      }),
      serializeCookie(USER_COOKIE, JSON.stringify(user), {
        maxAge: tokens.session_expires_in,
        httpOnly: false,
      }),
    ]);
  } catch {
    return errorRedirect(request, "orbita_unavailable");
  }
}

export async function handleOrbitaSsoRequest(request: Request): Promise<Response | null> {
  if (request.method !== "GET") return null;
  const pathname = new URL(request.url).pathname;
  if (pathname === "/auth/orbita/login") return startOrbitaLogin(request);
  if (pathname === "/auth/orbita/callback") return completeOrbitaLogin(request);
  return null;
}
