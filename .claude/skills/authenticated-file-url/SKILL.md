---
name: authenticated-file-url
description: Úsala en riwi-match al mostrar o descargar archivos protegidos por JWT (CV original/normalizado, Job Description) en un <iframe> o <a download>. El backend acepta el token por query param (?token=<jwt>) porque esos elementos no envían el header Authorization. Documenta el patrón y sus caveats de seguridad y SSR.
---

# URLs de archivo autenticadas (riwi-match)

Los endpoints de archivo del backend (CV, CV normalizado, JD) están protegidos por JWT.
Un `fetch`/axios normal manda `Authorization: Bearer <token>`, pero un `<iframe src>` o un
`<a download href>` **no pueden** mandar ese header. Por eso el backend acepta el token como
**query param**: `?token=<jwt>`.

Confirmado en el backend: `deps.py` → `get_current_user_with_query` lee `token: str | None =
Query(None)`, usado por `RequireRecruiterWithQuery` en los endpoints de archivo
(`candidates.py`, `processes.py`). Esos endpoints devuelven un **302 a una URL prefirmada de
R2** (validez ~1 h).

## Patrón

Los builders de URL cruda viven en `src/lib/api.ts` (`getCvFileUrl`,
`getNormalizedCvFileUrl`, `getJDFileUrl`) y devuelven la URL **sin** token. El token se añade
en el punto de uso con un helper `withToken`:

```ts
function withToken(url: string): string {
  if (typeof window === 'undefined') return url;            // guarda SSR (ver caveat)
  const token = localStorage.getItem('access_token');
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

// uso
<iframe src={withToken(processesApi.getCvFileUrl(processId, pcId))} />
<a href={withToken(processesApi.getNormalizedCvFileUrl(processId, pcId))} download>Descargar</a>
```

**Al estandarizar, centraliza `withToken` en `api.ts` junto a los builders** (hoy está
duplicado localmente en `hiring-processes/[id]/ranking/page.tsx`), para tener una sola fuente
de verdad.

## Caveats (importantes)

- ⚠️ **Seguridad — el JWT viaja en la URL.** Queda expuesto en el historial del navegador, en
  el `src` del `<iframe>` (visible en el DOM), en logs de acceso del servidor y en cabeceras
  `Referer`. Solo lo mitiga el TTL corto del access token. Si el backend ofrece una vía con
  header o cookie httpOnly, prefiérela. No uses este patrón para archivos altamente sensibles
  sin evaluar el riesgo.
- ⚠️ **SSR**: `withToken` llama `localStorage`. Debe ejecutarse solo en cliente; incluye la
  guarda `typeof window === 'undefined'` (o úsalo únicamente en subárboles cliente). Sin la
  guarda, moverlo a un path de render en servidor lanza `localStorage is not defined`.
- **Sin token**: si no hay `access_token`, `withToken` devuelve la URL sin credencial → el
  backend responde 401 y el `<iframe>`/enlace mostrará el error. Considera manejarlo
  explícitamente (redirigir a login o mostrar aviso) en vez de degradar en silencio.
- **Descarga cross-origin**: como el endpoint redirige (302) a un dominio de R2 distinto, el
  atributo `download` de `<a>` **será ignorado** por el navegador y el archivo se abrirá en
  lugar de descargarse. Ver skill `pdf-preview-modal`.

## Verificación

- Con sesión válida, el `<iframe>`/descarga carga el archivo; sin token, 401 visible.
- Ninguna llamada a `withToken`/`localStorage` corre en render de servidor.
