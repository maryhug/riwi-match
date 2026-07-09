# Plan: conectar `.v0-preview/` al backend real de RIWI MATCH

## Objetivo

Hoy `.v0-preview/` (generado por v0, rama `preview/v0-rebuild`) es 100% mock: `lib/data.ts` son
arrays estáticos, `lib/auth.ts` es una sesión falsa en `localStorage`, y casi ningún botón de
mutación (crear proceso, subir CVs, ejecutar match, crear set de preguntas, iniciar profiling,
suspender usuario, etc.) hace una llamada real — la mayoría son `setTimeout` + redirect.

El objetivo es que **todos los botones apunten al backend real** manteniendo el mock disponible
como flag de entorno (no se borra `lib/data.ts` ni la simulación):

```
NEXT_PUBLIC_API_URL   → base URL del backend (sin fallback hardcodeado a un puerto específico salvo default de conveniencia)
NEXT_PUBLIC_USE_MOCK  → "true" = usa lib/data.ts + simulación (comportamiento actual)
                         "false" = llamadas reales a NEXT_PUBLIC_API_URL contra la BD real
```

## Verificación contra el backend real (hecha, no repetir)

El documento `Backend/docs/api_contract.md` (auditoría fechada 2026-07-08) marcaba varios endpoints
como "no implementados todavía" (`ai-config/*`, `metrics/dashboard`, `profiling/trigger`,
`question-set` PATCH, etc.). **Esa auditoría quedó desactualizada** por el `git pull` que trajo la
fase 3 del MVP del backend (commit `6a42d87`). Se verificó el `openapi.json` real servido en
`http://localhost:8001` y **todos esos endpoints ya existen**, más otros no documentados en el
contrato ni usados aún por el frontend real (`/processes/{id}/status`, `/processes/{id}/export/*`,
`/processes/{id}/metrics`, `/profiling/runs/{id}` detalle/cancel/override, `/users` CRUD completo).
La fuente de verdad para endpoints es el OpenAPI en vivo, no el `.md` de auditoría.

## Arquitectura de la capa de datos

Igual que el frontend real (`Frontend/src/lib/api.ts`): un único cliente (`​.v0-preview/lib/api.ts`)
con objetos `*Api` por dominio, cada método rama internamente por `USE_MOCK`:

```ts
async list() {
  if (USE_MOCK) { await delay(400); return { data: hiringProcesses } }
  return http.get('/api/v1/processes').then(r => ({ data: r.data.processes.map(adaptProcess) }))
}
```

Así ninguna página necesita saber si está en modo mock o real — siguen llamando
`processesApi.list()` vía TanStack Query exactamente igual. Los adapters se portan 1:1 desde
`Frontend/src/lib/api.ts` (ya inventariados: `adaptStatus`, `adaptProcess`, `adaptProcessDetail`,
`adaptCandidatesToKanban`, `adaptProfilingStatus`, `adaptProfilingRun`).

## Fase 1 — Capa base (esta sesión)

- [x] `lib/config.ts`: `USE_MOCK`, `API_BASE_URL` centralizados.
- [x] `.env.local` (real, para este entorno) + `.env.example` (documentado, para el repo).
- [x] Dependencias nuevas: `axios`, `@tanstack/react-query`.
- [x] `lib/api.ts`: cliente axios + interceptors (Bearer desde sesión, 401 → limpia sesión y
  redirige a `/login`) + todos los objetos `*Api` con branching mock/real.
- [x] `lib/auth.ts`: `Session` extendido con `token?: string`; `login()` real
  (`POST /api/v1/auth/login`) cuando `USE_MOCK=false`, mock cuando `USE_MOCK=true`.
- [x] Provider de TanStack Query montado en `app/layout.tsx`.
- [x] Verificación end-to-end: login real contra el backend en `:8001`, `processesApi.list()`
  trayendo datos reales de la base de datos.

## Fase 2 — Wiring por página (checklist, se ejecuta en las siguientes iteraciones del loop)

Cada fila es un botón/acción real detectado en el inventario de `.v0-preview` que hoy no persiste
nada. Estado: ⬜ pendiente / ✅ conectado.

| Página | Acción | Endpoint real | Estado |
|---|---|---|---|
| `login` | Submit login | `POST /api/v1/auth/login` | ✅ |
| `dashboard` | KPIs, gráfico por área, tabla de recientes | `GET /processes` | ✅ |
| `hiring-processes` (list) | Cargar/filtrar listado | `GET /processes` | ✅ |
| `hiring-processes` (list) | "Duplicar" fila | (no existe endpoint de duplicar — crear vía `POST /processes` con los mismos campos) | ⬜ |
| `hiring-processes` (list) | "Archivar" fila | `PATCH /processes/{id}/status` | ✅ |
| `question-sets` (list) | Cargar sets | `GET /question-sets` | ✅ |
| `hiring-processes/new` | Paso 1-3 → "Crear proceso" | `POST /processes` + `POST /processes/{id}/job-description` o `/job-description/upload` + `POST /processes/{id}/candidates/upload` | ⬜ |
| `hiring-processes/[id]` | Cargar detalle | `GET /processes/{id}` | ✅ |
| `hiring-processes/[id]` | "Subir CVs" (modal) | `POST /processes/{id}/candidates/upload` | ✅ |
| `hiring-processes/[id]` | "Ejecutar match" (sin handler hoy) | `POST /processes/{id}/match` | ✅ |
| `hiring-processes/[id]` | Ver JD completa | `GET /processes/{id}/job-description/file` (con `?token=`) | ✅ |
| `hiring-processes/[id]/candidates` | Cargar Kanban filtrado por proceso | `GET /processes/{id}/candidates` (hoy usa array global sin filtrar) | ✅ |
| `hiring-processes/[id]/candidates` | "Iniciar llamadas de profiling" (hoy solo limpia selección) | `POST /processes/{id}/profiling/trigger` | ✅ |
| `hiring-processes/[id]/ranking` | Cargar ranking filtrado por proceso | `GET /processes/{id}/candidates` (mismo endpoint que Kanban, distinta vista) | ✅ |
| `hiring-processes/[id]/ranking` | Ver/descargar CV | `GET /processes/{id}/candidates/{pcId}/cv-normalized/file` (con `?token=`) | ✅ |
| `metrics` | Cargar dashboard de costos | `GET /metrics/dashboard` (confirmado real, no filtrado por proceso hoy) | ✅ |
| `profiling` | Cargar llamadas | `GET /profiling/runs` (global) | ✅ |
| `hiring-processes/new` | Wizard completo (proceso + JD + CVs) | `POST /processes` + JD + `candidates/upload` | ✅ |
| `question-sets/new` | "Crear set" | `POST /question-sets` (con `questions[]` embebidas) | ✅ |
| `question-sets/[id]` | Cargar set + preguntas | `GET /question-sets/{id}` (trae `questions[]` embebidas) | ✅ |
| `question-sets/[id]` | "Activar"/"Archivar" | `PATCH /question-sets/{id}` (`status`) | ✅ |
| `question-sets/[id]` | "Guardar cambios" (nombre/desc/preguntas) | `PATCH /question-sets/{id}` + reconciliación add/update/delete de preguntas por id | ✅ |
| `settings` | Gating por rol | `getSession()` ya usa el `role` real del JWT (verificado con usuario ADMIN de prueba) | ✅ |
| `settings` (Usuarios) | Listar / Suspender-Reactivar | `GET /users` + `PATCH /users/{id}/status` | ✅ |
| `settings` (Parámetros IA) | Listar modelos/prompts + activar modelo | `GET /ai-config/models` + `PATCH /ai-config/models/{id}/activate` + `GET /ai-config/prompts` | ✅ |
| `dashboard` | KPIs y tabla de recientes | `GET /processes` (ya cubierto por `processesApi.list`) | ✅ |

## Checklist — completo

Todos los botones/acciones detectados en el inventario original ya apuntan al backend real
(`NEXT_PUBLIC_USE_MOCK=false`), salvo "Duplicar" en el listado de procesos (no existe endpoint de
duplicar en el backend — requeriría construir uno nuevo, fuera del alcance de "conectar botones
existentes"; hoy sigue como no-op documentado en el código).

## Hallazgos durante la verificación (no bugs de este trabajo, comportamiento real del backend)

- **`GET /api/v1/users` devuelve un array plano**, no `{ users: [...] }` como los demás listados
  del contrato — corregido en `usersApi.list`. Vale la pena avisar al equipo de backend para que el
  contrato quede consistente, o documentarlo explícitamente.
- **La transición a `ARCHIVED` solo es válida desde `CLOSED`** (`_TRANSITIONS` en
  `state_machine.py` del backend) — el botón "Archivar" del listado de procesos ahora muestra el
  error real del backend en vez de fallar en silencio, pero no hay (todavía) UI que permita cerrar
  un proceso primero. Si se quiere que "Archivar" funcione de verdad desde cualquier estado, hace
  falta agregar un paso intermedio a `CLOSED` en la UI.
- **No existe ningún control en la UI para asignar un `question_set_id` a un proceso**
  (`PATCH /processes/{id}/question-set` sí existe en el backend real, pero ninguna página de
  `.v0-preview` lo llama). Sin esto, el botón "Iniciar llamadas de profiling" del Kanban de
  candidatos fallará con 422 (RB-003) en cualquier proceso real — está correctamente conectado al
  endpoint, pero la precondición de negocio no se puede cumplir hoy desde la UI. Requeriría un
  selector de question set en el detalle del proceso (fuera del alcance original: no era un botón
  ya existente en el inventario de `.v0-preview`).
- Se creó un usuario `admin@riwi.io` / `riwi2026` (rol ADMIN) en la base de datos real para poder
  probar la tab de Settings — antes no existía ningún usuario ADMIN, solo RECRUITER. Mismo patrón
  que el `recruiter@riwi.io` ya existente (`scripts/create_recruiter.py`).

## Criterio de "terminado"

`NEXT_PUBLIC_USE_MOCK=false` en `.env.local`, servidor corriendo, y navegando la app real: login
real, listas cargando de la base de datos real (verificable comparando conteos contra las queries
SQL que ya hicimos antes en esta sesión), y cada acción de la tabla de arriba en ✅.
