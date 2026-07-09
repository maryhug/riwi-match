# AGENTS.md — Frontend Riwi Match (`riwi-match/`)

Guía para agentes de IA que trabajan en el **frontend** de Riwi Match. Todo lo
que sigue aplica EXCLUSIVAMENTE a este subrepo (`riwi-match/`), que es un repo
git independiente. No toques `../cv-match-api/` ni la raíz del monorepo.

---

## ⚠️ Este NO es el Next.js que conoces

Este proyecto usa **Next.js 16** (App Router) con **React 19**. Esta versión
tiene **breaking changes** respecto a lo que probablemente tienes en tu memoria
de entrenamiento: APIs, convenciones y estructura de archivos pueden diferir.

**Antes de escribir cualquier código de Next.js, consulta la documentación local:**

```
node_modules/next/dist/docs/
  ├── 01-app          # App Router (lo que usa este proyecto)
  ├── 02-pages
  ├── 03-architecture
  └── 04-community
```

Respeta los avisos de deprecación. Existe además `AGENTS.md` en la raíz del
subrepo (`riwi-match/AGENTS.md`) con esta misma advertencia y un `CLAUDE.md` que
lo referencia con `@AGENTS.md`; no rompas esos archivos.

Ejemplos concretos de cambios ya presentes en el código:
- **`params` es una `Promise`.** En rutas dinámicas se resuelve con `use()`:
  ```tsx
  export default function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
  }
  ```
- Fuentes vía `next/font/google` (`Montserrat_Alternates`, `Plus_Jakarta_Sans`)
  exponiendo variables CSS (`--font-display`, `--font-body`).
- ESLint plano (`eslint.config.mjs`) usando `eslint-config-next/core-web-vitals`
  y `eslint-config-next/typescript`.

Cuando dudes de una API de Next.js, **lee los docs locales, no asumas.**

---

## Qué es este proyecto

Panel web (dashboard) de **Riwi Match**, plataforma de matching de CVs con IA
para procesos de contratación. Este frontend consume el backend FastAPI
(`../cv-match-api/`) y ofrece: gestión de procesos de contratación, parseo de
Job Descriptions con IA, carga de CVs, tablero Kanban de candidatos por match,
sets de preguntas de profiling, ejecución de profiling por voz, métricas/costos
y configuración de modelos y prompts de IA (solo ADMIN).

Stack: **Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS
4 · TanStack Query 5 · axios · react-hook-form + zod · framer-motion/motion ·
lucide-react · recharts**.

---

## Comandos

```bash
npm run dev      # servidor de desarrollo en http://localhost:3000
npm run build    # build de producción
npm run start    # sirve el build de producción
npm run lint     # eslint
```

No hay tests configurados en este subrepo.

---

## Variables de entorno

Prefijo `NEXT_PUBLIC_` = expuestas al cliente. Se leen en `src/lib/api.ts`.

| Variable | Default | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL base del backend FastAPI. |

Colócala en `.env.local` (no versionado).

> **Nota (rama `feature/connection`):** esta es la rama de **integración real** con el
> backend. Aquí **se eliminó** el mecanismo de mocks: **no existe** `NEXT_PUBLIC_USE_MOCK`
> ni el helper `withFallback`, y `src/lib/mockData.ts` quedó **huérfano** (ningún archivo lo
> importa). No lo uses; consume siempre datos reales del backend.

---

## Estructura de rutas (App Router)

Rutas bajo `src/app/` usando **grupos de rutas** entre paréntesis (no afectan la
URL, solo agrupan layouts):

```
src/app/
├── layout.tsx                 # Root layout: fuentes + <AuthProvider> + <Providers> (TanStack Query)
├── page.tsx                   # "/" → redirect('/dashboard')
├── providers.tsx              # QueryClientProvider (TanStack Query)
├── globals.css                # Tailwind 4 + tokens de tema (@theme)
│
├── (auth)/
│   └── login/page.tsx         # /login  — form react-hook-form + zod (usuarios demo)
│
└── (dashboard)/
    ├── layout.tsx             # Guard de auth + <FloatingNav> dentro de <NavbarPositionProvider>
    ├── dashboard/page.tsx     # /dashboard        — panel de equipo
    ├── hiring-processes/
    │   ├── page.tsx           # /hiring-processes  — listado
    │   ├── new/page.tsx       # /hiring-processes/new — asistente (JD + CVs)
    │   └── [id]/
    │       ├── page.tsx       # /hiring-processes/:id — JD + CVs + match
    │       ├── candidates/page.tsx  # /hiring-processes/:id/candidates — Kanban
    │       └── ranking/page.tsx     # /hiring-processes/:id/ranking — tabla de ranking + drawer de detalle
    ├── metrics/page.tsx       # /metrics           — costos/métricas
    ├── profiling/page.tsx     # /profiling         — ejecución de profiling
    ├── question-sets/
    │   ├── page.tsx           # /question-sets     — listado
    │   ├── new/page.tsx       # /question-sets/new — crear (form + preguntas)
    │   └── [id]/page.tsx      # /question-sets/:id — detalle/editar
    └── settings/page.tsx      # /settings          — solo ADMIN (modelos/prompts IA)
```

- El grupo `(dashboard)/layout.tsx` protege TODO lo que cuelga de él (ver más
  abajo, "Sesión y rutas protegidas") y renderiza la **navbar flotante**
  reposicionable `FloatingNav` dentro de `NavbarPositionProvider`. El `<main>`
  ajusta su padding según la posición actual de la navbar.
- La navegación vive en `NAV_ITEMS` dentro de
  `src/components/layout/FloatingNav.tsx` (Procesos, Preguntas, Nuevo, Dashboard,
  Costos). El item de `/settings` (Config) solo se añade si `role === 'ADMIN'`.
  La posición (`left | right | top | bottom`) se persiste en `localStorage` vía
  `src/contexts/NavbarPositionContext.tsx`.
- ⚠️ `src/components/layout/Sidebar.tsx` **todavía existe** en esta rama pero está
  **huérfano** (ningún archivo lo importa); la navegación real es `FloatingNav`.

---

## Cliente HTTP — `src/lib/api.ts` (única puerta al backend)

Es el **único** cliente HTTP del proyecto. No crees instancias de axios ni uses
`fetch` directo en las páginas: todo pasa por aquí.

Características:
- Instancia axios con `baseURL = NEXT_PUBLIC_API_URL` y `Content-Type: application/json`.
- **Interceptor de request**: adjunta `Authorization: Bearer <token>` leyendo
  `localStorage.getItem('access_token')` (guardado ante `typeof window`).
- **Interceptor de response**: ante **401** limpia `access_token`/`user_role` de
  `localStorage` y redirige con `window.location.href = '/login'`.
- **Capa de adapters** (sección `// ─── Adapters ───`): como el backend y el front
  tienen shapes distintas, cada lectura resuelve con `.then((r) => ({ data:
  adaptXxx(r.data) }))`. Funciones reales: `adaptProcess`, `adaptProcessDetail`,
  `adaptStatus` (mapea el enum de estado del backend al del front con fallback
  seguro), `adaptCandidatesToKanban` (lista plana → buckets `{HIGH,MEDIUM,LOW,
  LOADED,PARSING}`). Los tipos del backend se nombran `Backend*`/`*Response` y se
  mantienen separados de los del front. Ver skill `backend-response-adapter`.
- **Subida de archivos (multipart)**: `uploadJDFile` (campo `file`) y
  `uploadCandidates` (campo repetido `files`) construyen `FormData` y
  **sobreescriben el header** con `{ 'Content-Type': 'multipart/form-data' }`.
- **URLs de archivo**: builders que devuelven la URL cruda (`getCvFileUrl`,
  `getNormalizedCvFileUrl`, `getJDFileUrl`). Como `<iframe>`/`<a download>` no
  mandan el header `Authorization`, las páginas añaden el JWT como query param
  (`?token=<jwt>`, patrón `withToken` en `ranking/page.tsx`).
- **Endpoints stub**: varios métodos son `Promise.resolve(...)` porque el backend
  aún no los expone (`parseJD`, `startProfiling`, `getProfilingRuns`,
  `candidatesApi.updateNotes/updateStatus`, `settingsApi.*`, `metricsApi.*`). Están
  comentados como "aún no disponible en el back" para no romper la UI que ya los consume.

APIs agrupadas por dominio y exportadas con nombre:
`authApi`, `processesApi`, `candidatesApi`, `questionSetsApi`, `settingsApi`,
`metricsApi`. El export default es la instancia axios cruda (`api`).

**Para añadir un endpoint:** agrégalo al grupo correspondiente en `api.ts`,
tipando request/response con los tipos de `src/lib/types.ts`. Si la shape del
backend difiere de la del front, escribe un `adaptXxx` en la sección de adapters.
No uses `fetch` directo en las páginas (hay un caso legado en `ranking/page.tsx`;
no lo imites). Ver skills `add-api-endpoint-with-query` y `backend-response-adapter`.

---

## Estado del servidor — TanStack Query

- Provider en `src/app/providers.tsx` (`QueryClient` con `retry: 1`,
  `staleTime: 30_000`), montado en el root layout.
- Patrón en páginas cliente (ver `hiring-processes/[id]/page.tsx`,
  `.../candidates/page.tsx` y `.../ranking/page.tsx`):
  ```tsx
  const { data, isLoading } = useQuery({
    queryKey: ['kanban', id],
    queryFn: () => processesApi.getKanban(id).then((r) => r.data),
  });

  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (files: File[]) => processesApi.uploadCandidates(id, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban', id] }),
  });
  ```
- **Convención de `queryKey`**: `[recurso, ...ids]`. En uso real: `['process', id]`,
  `['candidates', id]`, `['kanban', id]`, `['candidate-detail', processId, pcId]`,
  `['profiling-runs', processId]`. Invalida esas mismas keys tras las mutaciones.
- **Polling de tareas Celery** (parseo de CV, match): usa `refetchInterval` como
  **función** que se detiene al llegar a estado terminal, no un intervalo fijo
  (ver `ranking/page.tsx`). A nivel de proceso, `processesApi.getMatchStatus(id)`
  expone `progress_pct` e `is_complete`. Ver skill `manejar-estados-ui`.

---

## Sesión, auth y rutas protegidas — `src/contexts/AuthContext.tsx`

- `AuthProvider` (montado en el root layout) mantiene `{ token, role,
  isAuthenticated, isLoading }` y expone `login(token, role)` / `logout()`.
- La sesión se **persiste en `localStorage`** con las claves `access_token` y
  `user_role`. Al montar, hidrata el estado desde ahí (`isLoading` cubre ese
  primer render en servidor/cliente).
- Hook de consumo: `useAuth()` (lanza si se usa fuera del provider).
- **Guard de rutas**: `(dashboard)/layout.tsx` usa `useAuth()`; mientras
  `isLoading` muestra spinner, y si `!isAuthenticated` hace
  `router.push('/login')`. Cualquier página nueva dentro de `(dashboard)/` queda
  protegida automáticamente.
- **Roles** (`Role` en `types.ts`): `'ADMIN' | 'RECRUITER' | 'TA_LEADER'`.
  Restringe UI comparando `role` (ej.: item de Settings/Config solo para `ADMIN`).
- El login (`(auth)/login/page.tsx`) usa **auth real**: llama
  `authApi.login(email, password)` y pasa `res.data.access_token` / `res.data.role`
  a `login(...)`. (Ya no hay usuarios demo hardcodeados ni `'demo-token'`.)

---

## Formularios — react-hook-form + zod

Patrón consistente (ver `login/page.tsx` y `question-sets/new/page.tsx`):

```tsx
const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<FormData>({ resolver: zodResolver(schema) });

<form onSubmit={handleSubmit(onSubmit)}>
  <Input label="Email" error={errors.email?.message} {...register('email')} />
  <Button type="submit" loading={isSubmitting}>Ingresar</Button>
</form>
```

- Usa siempre los componentes de `src/components/ui/Input.tsx` (`Input`,
  `Textarea`, `Select`, con `forwardRef` → compatibles con `register`) y
  `Button` (`src/components/ui/Button.tsx`, prop `loading`).
- Mensajes de validación **en español**.

---

## Tipos compartidos y mocks

- `src/lib/types.ts`: **un solo lugar** para los tipos de datos de la API. Dos
  familias que **no** se deben mezclar:
  - Tipos del **backend** (crudos): `BackendProcessStatus`, `BackendCandidateStatus`,
    `ProcessesListResponse`, `ProcessDetail`, `CandidateListItem`,
    `CandidateListResponse`, `CandidateDetail`, `MatchBreakdown`,
    `MatchStatusResponse`, `MatchTriggerResponse`, `JobDescriptionSaved`.
  - Tipos del **front** (consumidos por la UI): `Role`, `HiringProcess`,
    `ProcessStatus`, `MatchCategory`, `CandidateStatus`, `DualMatchCandidate`,
    `DualKanbanResponse`, `QuestionSet`, `ProfilingQuestion`, `ProfilingRun`,
    `AIModelConfig`, `AIPrompt`, `MetricsDashboard`, DTOs, etc.
  Los `adaptXxx` de `api.ts` traducen de los primeros a los segundos.
- ⚠️ `src/lib/mockData.ts` (constantes `MOCK_*`) quedó **huérfano** en esta rama:
  ya no hay `withFallback` que lo consuma. No agregues mocks nuevos aquí.
- `src/lib/utils.ts`: helper `cn` (clsx), formateadores (`formatCurrency`,
  `formatDate` en `es-CO`, `formatPercent`) y config de estados/categorías
  (`matchCategoryConfig`, `processStatusConfig`, `getProcessStep`).

---

## UI, estilos y componentes

- **Tailwind CSS 4** vía `@import "tailwindcss"` en `globals.css`. El tema
  (colores de marca, fuentes) se define con `@theme { --color-*, --font-* }`.
  Usa esos tokens (p. ej. `var(--color-primary)`, `--color-ink`, `--color-coral`,
  `--color-mint`) en lugar de hex sueltos cuando sea posible.
- Componentes UI reutilizables en `src/components/ui/`: `Button`, `Input`
  (+`Textarea`,`Select`), `Card` (+`CardHeader`,`CardContent`), `Badge`,
  `CircularProgress`, y en esta rama `UploadCvsModal` (subida drag&drop
  multi-archivo con invalidación de queries) y `PdfPreviewModal` (visor de PDF en
  `<iframe>`).
- Layout compartido en `src/components/layout/`: `FloatingNav` (navbar flotante
  reposicionable, navegación real de la app), `Header` (título/subtítulo + rol).
  `Sidebar` sigue en la carpeta pero está **huérfano** (no se importa).
- Iconos: `lucide-react`. Gráficas: `recharts`. Animaciones: `motion` /
  `framer-motion`.
- Alias de imports: `@/*` → `src/*` (configurado en `tsconfig.json`).

---

## Convenciones del proyecto

- **Idioma**: UI, textos, comentarios y mensajes de validación **en español**
  (mantén esta convención).
- **`'use client'`** en todo componente que use hooks de estado/efecto, contexto,
  TanStack Query o `next/navigation`. Las páginas del dashboard son client
  components.
- Navegación de cliente con `useRouter()`/`Link` de **`next/navigation`**.
- No hardcodees la URL del backend: usa `api.ts` (que lee `NEXT_PUBLIC_API_URL`).
- No accedas a `localStorage` sin proteger con `typeof window !== 'undefined'`.
- TypeScript **strict**; tipa contra `src/lib/types.ts`. Corre `npm run lint`
  antes de dar por terminado un cambio.
- No hagas commits ni cambies de rama salvo que se pida explícitamente.
