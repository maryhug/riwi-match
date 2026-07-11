# CLAUDE.md — Frontend (riwi-match)

Frontend de RIWI MATCH. Este repo es un **submódulo** del monorepo `RiwiMatch`; la guía completa
del proyecto (qué es, cómo se relaciona con el backend) vive en el `CLAUDE.md` de la raíz del repo
padre, un nivel arriba de este submódulo.

**Antes de asumir la arquitectura descrita aquí**: este repo tiene ramas con stacks de frontend
distintos (una versión antigua en Next.js, prototipos experimentales). Corre
`git branch --show-current` — este documento describe la rama `feature/backend-integration`
(y sus descendientes), la única con integración real al backend FastAPI.

## Esencial

- Stack: **TanStack Start** (SSR sobre Vite) + **TanStack Router** (file-based routing) + React 19
  + Tailwind 4. Desplegado como Cloudflare Worker vía nitro.
- **Patrón BFF**: el browser nunca llama al backend directo. Toda comunicación pasa por *server
  functions* (`createServerFn`) que corren en el Worker — ver `src/lib/api/*.functions.ts`.
- Los tokens JWT viven en cookies **httpOnly**, nunca en `localStorage` ni expuestos al browser.
- No hay modo mock. `src/lib/mock-data.ts` fue eliminado — si ves un import roto hacia ese
  archivo, es una rama vieja sin mergear, no un bug de esta rama.

```bash
npm run dev                          # http://localhost:8080
npm run build                        # build de producción (nitro/Cloudflare Workers)
npm run lint                         # eslint + prettier
npx eslint . --fix                   # autofix de formato (Prettier vía eslint)
npx tsc --noEmit -p tsconfig.json    # type-check completo — `npm run build` NO chequea tipos
```

Variable de entorno: `API_BASE_URL` en `.env` (copiar de `.env.example`), server-only — URL del
backend FastAPI. Nunca la prefijes con `VITE_`.

## Arquitectura

### Server functions (`src/lib/api/*.functions.ts`)

Un archivo por dominio: `auth`, `processes`, `candidates`, `match`, `profiling`,
`question-sets`, `users`, `ai-config`, `audit`, `reports`, `ai-feedback`, `metrics`. Cada función
es un `createServerFn({ method: "GET" | "POST" })` que valida su input con Zod (`.validator(...)`,
**no** `.inputValidator()` — está deprecado en esta versión de TanStack Start) y llama a
`apiCall<T>()` de `src/lib/api/client.server.ts`.

Para agregar un endpoint nuevo del backend:
1. Verifica el shape exacto de la respuesta leyendo el router de FastAPI en
   `Backend/src/api/v1/*.py` — no lo infieras del nombre del endpoint.
2. Agrega el tipo de respuesta a `src/lib/types/api.ts`. Si el campo es JSONB genérico
   (`Record<string, X>`), usa `Record<string, any>` con
   `// eslint-disable-next-line @typescript-eslint/no-explicit-any` — TanStack Start rechaza
   `unknown` en el tipo de retorno de un server function porque no puede probar que sea
   serializable, aunque en runtime sí lo sea (viene de un `fetch` JSON).
3. Agrega la función en el archivo `*.functions.ts` correspondiente.
4. Si es un enum nuevo, agrégalo (+ su label en español) a `src/lib/types/enums.ts`.

### Cliente HTTP (`src/lib/api/client.server.ts`)

Único punto de contacto con el backend. Lee `API_BASE_URL` de `process.env` **dentro de una
función**, nunca a nivel de módulo (en Cloudflare Workers el env se bindea por request — leerlo al
importar el módulo devuelve `undefined`). Adjunta el `access_token` de la cookie httpOnly como
Bearer; si el backend responde 401, intenta un refresh automático con `rm_refresh` y reintenta una
vez. Los errores `{detail: "..."}` del backend se mapean a `ApiError(status, detail)`.

### Autenticación (`src/lib/auth-context.tsx`, `src/lib/api/auth.functions.ts`)

- `login()` llama `POST /auth/login` + `GET /users/me` (el `TokenResponse` del backend no trae
  nombre/email, solo `access_token`/`refresh_token`/`role`) y setea 3 cookies:
  `rm_access`/`rm_refresh` (httpOnly) y `rm_user` (no-httpOnly, JSON con `{id, name, last_name,
  email, role, status}` — solo un hint de UI, la autorización real siempre la valida el backend).
- `AuthProvider` se monta en `src/routes/__root.tsx`, dentro de `QueryClientProvider`.
- Rutas bajo `/app/*` están protegidas por `beforeLoad` en `src/routes/app.tsx`, que llama
  `getSession()` server-side y redirige a `/` si no hay sesión.
- El rol del usuario (`useAuth().user.role`) controla la visibilidad de nav en
  `src/components/app/FloatingNav.tsx` — `ADMIN` ve todo, `RECRUITER` no ve Admin/Equipo,
  `TA_LEADER` no ve Sets/Profiling/Admin. Esto es solo UX: el backend re-valida el rol en cada
  endpoint independientemente de lo que muestre la nav.

### Descargas de archivo (`src/lib/download-proxy.server.ts`)

Los CVs y los exports CSV requieren navegación directa del browser (`<a href>`, `target=_blank`),
que no puede pasar por `createServerFn` (RPC) porque el browser no puede adjuntar el Bearer de una
cookie httpOnly a una navegación normal. Solución: rutas HTTP reales interceptadas en
`src/server.ts` **antes** de delegar al handler de TanStack Start:

- `/dl/cv/{processId}/{pcId}` · `/dl/cv-normalized/{processId}/{pcId}`
- `/dl/jd/{processId}`
- `/dl/export/ranking/{processId}` · `/dl/export/costs/{processId}`

Cada una parsea la cookie del `Request` crudo, llama al backend con el Bearer real
(`Authorization` header, no query param), y reenvía el 302 a la URL firmada de R2 o el stream CSV
tal cual — el browser nunca ve el token.

### Tipos (`src/lib/types/`)

- **`api.ts`**: tipos que reflejan 1:1 las respuestas reales del backend. Casos borde documentados
  inline: `human_override_match=0` colapsa a `null` en la respuesta (bug del backend, no del
  frontend — `if pc.human_override_match else None` trata `0` como falsy), y varias claves
  (`match_summary`, `strengths`, `gaps`, `breakdown`) están ausentes del todo (no `null`) cuando
  `match_explanation` no existe — tipadas como opcionales (`?`), no `| null`.
- **`enums.ts`**: literal unions de cada estado del backend (`ProcessStatus`, `CandidateStatus`,
  `MatchCategory`, `ProfilingRunStatus`, `AdvancementProbability`, `UserRole`, etc.) + un
  `Record<Enum, string>` con el label en español para renderizar en la UI.

Ninguno se genera automáticamente — si cambia un schema en `Backend/`, actualiza ambos a mano.

### Polling (`src/lib/polling.ts`)

No hay SSE ni websockets — el backend no los expone. `candidateStatusesRefetchInterval` y
`profilingRunsRefetchInterval` implementan polling adaptativo: refetch cada 3s/10s mientras haya
candidatos o corridas de profiling en estados no terminales, con un tope de seguridad de 3 minutos
para no pollear indefinidamente si un worker de Celery se atasca.

### Componentes de negocio (`src/components/app/`)

- `ProfilingResultModal.tsx` — resumen de una llamada completada, respuestas por pregunta con
  confianza, transcripción/audio, tabla de costos. Reutilizado desde el ranking, el drawer de
  candidato y el monitor de profiling.
- `UploadCvsModal.tsx` — dropzone reutilizable (wizard de creación y detalle de proceso).
- `SetBuilder.tsx` / `QuestionFormDialog.tsx` — CRUD de sets de preguntas. `SetBuilder` maneja el
  clonado silencioso del backend: si el set está `ACTIVE`, cualquier escritura devuelve un
  `question_set_id` distinto (nueva versión) y el componente navega ahí automáticamente.

## Convenciones

- Todo el texto de UI y los mensajes de error/éxito (`toast.*`) están en español.
- No fabriques datos que el backend no expone (tendencias, promedios sin fuente real, badges de
  estado "verificado" sin endpoint de verificación). Si un dato no está disponible, usa un estado
  vacío honesto ("Sin datos aún") en vez de inventar un placeholder que parezca real — ver
  `app.costos.tsx` o `app.admin.tsx` (tab Integraciones) como referencia de este criterio.
- Componentes `.tsx` con lógica de UI van en `src/components/app/`; primitivos de shadcn/ui
  (generados, no editar el estilo base) en `src/components/ui/`.
