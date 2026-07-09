---
name: add-api-endpoint-with-query
description: Úsala al conectar el frontend con un endpoint del backend en riwi-match (rama de integración) — añadir un método al cliente axios en src/lib/api.ts y consumirlo desde una página con TanStack Query. Cubre el patrón real de esta rama: tipos Backend* vs Front, adapter de traducción de shapes, multipart, URLs de archivo con token y convención de queryKey/invalidación. Evita esparcir llamadas fetch sueltas y mapeos frágiles por las páginas.
---

# Añadir un endpoint y consumirlo con TanStack Query (riwi-match)

> ⚠️ Next.js: esta versión tiene breaking changes. Antes de escribir código de rutas/hooks
> consulta `node_modules/next/dist/docs/`. Ver la skill `check-nextjs-docs`.

**`src/lib/api.ts` es el único cliente HTTP.** Ninguna página debe llamar a `axios`/`fetch`
directamente (hay un caso legado de `fetch` PATCH en `ranking/page.tsx`; no lo imites).
El cliente ya inyecta el `Bearer` desde `localStorage.access_token` y, ante un 401, limpia
la sesión y redirige a `/login`.

> Nota: en esta rama **no existe** `withFallback` ni `NEXT_PUBLIC_USE_MOCK`; `mockData.ts`
> está huérfano. No envuelvas nada en fallback a mocks.

## Paso 1 — Tipar el contrato (en `src/lib/types.ts`)

Si la shape del backend difiere de la que consume el front (lo normal aquí), define **dos**
tipos y no los mezcles:
- `BackendXxx` / `XxxResponse` — exactamente lo que devuelve la API.
- `Xxx` — lo que el front consume.

Ejemplos reales: `BackendProcessStatus` vs `ProcessStatus`, `ProcessesListResponse` vs
`HiringProcess`, `CandidateListResponse` vs `DualKanbanResponse`.

## Paso 2 — Añadir el método al objeto `*Api` correcto

Agrégalo al objeto exportado que corresponda (`processesApi`, `authApi`, `candidatesApi`,
`questionSetsApi`, `settingsApi`, `metricsApi`), no sueltes funciones nuevas.

- **Lectura simple 1:1:** `api.get<T>('/api/v1/...')`.
- **Lectura con shape distinta → adapter** (patrón dominante en esta rama): resuelve con
  `.then((r) => ({ data: adaptXxx(r.data) }))`. Escribe la función `adaptXxx` en la sección
  `// ─── Adapters ───` de `api.ts`, con un comentario que explique el mapeo. Modelos de
  referencia: `adaptProcess`, `adaptProcessDetail`, `adaptStatus`, `adaptCandidatesToKanban`.
- **Mutación:** `api.post/patch/delete<T>('/api/v1/...', body)`.
- **Subida de archivos (multipart):** construye un `FormData`, y **sobreescribe el header por
  request** — el cliente global fija `application/json`:
  ```ts
  return api.post<T>(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  ```
  Un archivo → `form.append('file', file)`; varios → `files.forEach(f => form.append('files', f))`
  (campo repetido). Ver `uploadJDFile` / `uploadCandidates`.
- **URL de archivo para `<iframe>`/descarga:** expón un builder que devuelva la URL cruda
  (`getCvFileUrl`, `getNormalizedCvFileUrl`, `getJDFileUrl`). Como `<iframe>`/`<a download>`
  no envían el header `Authorization`, en la página añade el JWT como query param
  (`?token=<jwt>`, patrón `withToken` de `ranking/page.tsx`).
- **Endpoint que el backend aún no expone:** deja un stub `Promise.resolve({ data: ... })`
  con comentario `// aún no disponible en el back` (ver `parseJD`, `startProfiling`,
  `settingsApi`, `metricsApi`) para no romper la UI que ya lo consume.

## Paso 3 — Consumir con TanStack Query en la página

`QueryClient` está en `src/app/providers.tsx` (`retry: 1`, `staleTime: 30s`). En un componente
`'use client'`:

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['process', id],
  queryFn: () => processesApi.get(id).then((r) => r.data),
});
```

- **Convención de `queryKey`:** entidad + identificadores. En uso: `['process', id]`,
  `['candidates', id]`, `['kanban', id]`, `['candidate-detail', processId, pcId]`,
  `['profiling-runs', processId]`.
- **Mutaciones:** `useMutation` + invalidación de las keys afectadas:
  ```ts
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (files: File[]) => processesApi.uploadCandidates(id, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['process', id] });
      qc.invalidateQueries({ queryKey: ['candidates', id] });
      qc.invalidateQueries({ queryKey: ['kanban', id] });
    },
  });
  ```
- **Trabajo async de workers Celery** (parseo de CV, match): usa `refetchInterval` como
  función que se detiene cuando todo terminó, no un intervalo fijo. Ver la skill
  `poll-async-task-until-complete` si existe.

## Verificación

- Con el backend arriba (`NEXT_PUBLIC_API_URL`), la página carga datos reales; el 401 redirige a `/login`.
- `npm run lint` sin errores; revisa que no quedaron `any` innecesarios en los tipos Backend/Front.
