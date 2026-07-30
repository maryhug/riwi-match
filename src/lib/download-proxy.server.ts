import process from "node:process";

// Proxy de descargas: el browser navega directo a estas rutas (<a href>, target=_blank),
// así que no puede pasar por createServerFn (RPC) ni leer la cookie httpOnly rm_access para
// adjuntarla como query param. Este handler corre en el Worker, lee la cookie del request
// crudo, llama al backend con el Bearer real, y reenvía la redirección 302 (a la URL firmada
// de R2) o el stream (CSV) tal cual — el browser nunca ve el token.

function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

const ROUTES: Array<{ pattern: RegExp; backendPath: (m: RegExpMatchArray) => string }> = [
  {
    pattern: /^\/dl\/cv\/([^/]+)\/([^/]+)$/,
    backendPath: (m) => `/api/v1/processes/${m[1]}/candidates/${m[2]}/cv/file`,
  },
  {
    pattern: /^\/dl\/cv-normalized\/([^/]+)\/([^/]+)$/,
    backendPath: (m) => `/api/v1/processes/${m[1]}/candidates/${m[2]}/cv-normalized/file`,
  },
  {
    pattern: /^\/dl\/jd\/([^/]+)$/,
    backendPath: (m) => `/api/v1/processes/${m[1]}/job-description/file`,
  },
  {
    pattern: /^\/dl\/export\/ranking\/([^/]+)$/,
    backendPath: (m) => `/api/v1/processes/${m[1]}/export/ranking`,
  },
  {
    pattern: /^\/dl\/export\/costs\/([^/]+)$/,
    backendPath: (m) => `/api/v1/processes/${m[1]}/export/costs`,
  },
  {
    pattern: /^\/dl\/profiling-audio\/([^/]+)$/,
    backendPath: (m) => `/api/v1/profiling/runs/${m[1]}/audio`,
  },
];

export async function handleDownloadRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/dl/")) return null;

  const route = ROUTES.find((r) => r.pattern.test(url.pathname));
  if (!route) return new Response("Not found", { status: 404 });

  const match = url.pathname.match(route.pattern)!;
  const accessToken = parseCookie(request.headers.get("cookie"), "rm_access");
  if (!accessToken) return new Response("No autenticado", { status: 401 });

  const reqHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    reqHeaders["Range"] = rangeHeader;
  }

  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:8000";
  const backendResponse = await fetch(`${baseUrl}${route.backendPath(match)}`, {
    headers: reqHeaders,
    redirect: "manual",
  });

  // El backend devuelve 302 a una URL firmada de R2 (archivos) o 200 con CSV (exports).
  if (backendResponse.status >= 300 && backendResponse.status < 400) {
    const location = backendResponse.headers.get("location");
    if (location) return Response.redirect(location, 302);
  }

  if (!backendResponse.ok) {
    return new Response(await backendResponse.text(), { status: backendResponse.status });
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: backendResponse.headers,
  });
}
