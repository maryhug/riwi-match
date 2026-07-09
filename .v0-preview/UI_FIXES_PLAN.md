# Plan: 8 correcciones de UI/UX en `.v0-preview`

## Contexto

El usuario revisó el preview corriendo (`.v0-preview/`, rama `preview/v0-rebuild`, ya conectado al
backend real vía `lib/api.ts` con flag `NEXT_PUBLIC_USE_MOCK`) y mandó 8 capturas/pedidos de
correcciones puntuales de diseño y de un cambio de producto (reemplazar el Kanban de CV-match por
un Kanban de ejecución de profiling). Se investigó a fondo con 3 agentes Explore + 1 agente Plan
(que corrigió una hipótesis inicial leyendo el código real del backend) antes de este plan — todo
lo que sigue está grounded en código real, no en suposiciones.

Este plan reemplaza por completo el plan anterior (`BACKEND_INTEGRATION_PLAN.md`, ya ejecutado y
archivado en el propio repo) — es una tarea distinta.

## Resumen de los 8 puntos y su diseño

1. **Acentos cafés → escala de grises.** Los tokens neutros actuales (`--color-bg-subtle
   #ECE3D2`, `--color-border #E3D9C4`) son cálidos/khaki y se usan como "color neutro" en varios
   badges (`StatusBadge` DRAFT, `question-sets` DRAFT/ARCHIVED, `settings` inactivo/desconectado,
   pipeline paso "todo"), donde leen como marrón. Se agregan tokens `--color-neutral` /
   `--color-neutral-light` (gris verdadero, no khaki) y se reemplazan esos ~8 usos puntuales — el
   fondo cálido general de la app (`--color-bg`, `--color-surface`) **no se toca**, solo los
   acentos/badges neutros.
2. **Nuevo set de preguntas — layout 2 columnas.** Hoy `question-sets/new` y `question-sets/[id]`
   apilan verticalmente: card de nombre/descripción arriba, luego el builder de preguntas abajo,
   todo a `max-w-3xl`. Pasa a un layout `lg:grid-cols-[380px_1fr]`: columna izquierda = info del
   set (nombre, descripción, y en `[id]` también el bloque de ciclo de vida), columna derecha =
   las preguntas como tarjetas "burbuja" (ver punto 5).
3. **Botón de retroceder tipo burbuja (HIG).** No existe ningún botón de volver reutilizable hoy
   en el proyecto. Se crea `components/riwi/back-button.tsx`: botón circular (`size-10
   rounded-full border border-border bg-surface shadow-tinted`, ícono `ArrowLeft`, ya usado en
   otro lugar del proyecto) que recibe `href`. Se agrega en: `hiring-processes/[id]` (→
   `/hiring-processes`), `hiring-processes/[id]/ranking` (→ `/hiring-processes/[id]`),
   `question-sets/new` (→ `/question-sets`), `question-sets/[id]` (→ `/question-sets`). Las
   páginas de nivel de navbar (Dashboard, Procesos, Preguntas, Costos, la nueva "Ejecución del
   profiling") no llevan botón de volver, igual que hoy.
4. **Kanban de "Ejecución del profiling" reemplaza "Ver candidatos".** Verificado contra el código
   real del backend (`state_machine.py`, `whatsapp_message_usecase.py`, `profiling.py`,
   `parse_cv.py`): las 5 columnas se derivan **directo de `CandidateStatus`** (campo `status` que
   ya trae `GET /processes/{id}/candidates`), sin necesitar `whatsapp_consent` para decidir la
   columna:

   | Columna | `CandidateStatus` |
   |---|---|
   | Cola | `MATCHED` |
   | Mensaje Enviado | `PROFILING_QUEUED` |
   | En Llamada | `PROFILING_CALLING` |
   | Completada | `PROFILING_COMPLETED` |
   | No contestada | `PROFILING_FAILED` |

   Es una vista **global** (no por proceso), así que cada card debe mostrar a qué proceso
   pertenece. Como no existe un endpoint global de candidatos, se agrega
   `processesApi.getProfilingBoard()` en `lib/api.ts` que orquesta: `processesApi.list()` → por
   cada proceso `processesApi.getCandidatesList(id)` → bucketea por `status` → enriquece con
   `processesApi.getGlobalProfilingRuns()` (cruzando por `process_candidate_id`) para
   `call_attempts`/`advancement_probability`/fechas en las últimas 3 columnas. Patrón N+1
   aceptable al volumen actual (~5-16 procesos).

   El Kanban de CV-match (`hiring-processes/[id]/candidates/page.tsx`) es **hoy el único lugar**
   con el botón "Iniciar llamadas de profiling" (`processesApi.startProfiling`) — al borrar esa
   página esa acción se reubica en la columna **Cola** del nuevo Kanban (selección múltiple +
   barra flotante, agrupando por `process_id` ya que el endpoint es por-proceso).

   Reemplaza la ruta `/profiling` in-place (mismo path, contenido nuevo). Se agrega a
   `NAV_ITEMS` de `floating-nav.tsx` con ícono `PhoneCall` (ya usado en el proyecto), label
   "Ejecución del profiling". Se quita el botón "Ver candidatos" de
   `hiring-processes/[id]/page.tsx` ("Ver ranking" queda intacto). Se borra
   `hiring-processes/[id]/candidates/page.tsx` y se limpia lo que quede huérfano:
   `processesApi.getKanban`, `adaptCandidatesToKanban`, `BackendCandidateListItem`,
   `DualKanbanResponse`, `DualMatchCandidate` (en `lib/api.ts` / `lib/types.ts` / mocks de
   `lib/data.ts`).
5. **Editar pesos/keywords en el builder — ya existe, se rediseña visualmente.** El `TagInput` de
   keywords positivas/riesgo ya funciona bien (agrega con Enter/coma, quita con click, muestra
   chips de colores) — no hay bug que arreglar ahí. La brecha real: **`eval_criteria` nunca se
   renderiza** pese a existir en el tipo `ProfilingQuestion` — se agrega un `Textarea` para ese
   campo. El resto del punto se resuelve rediseñando la tarjeta de cada pregunta (dentro del
   layout de 2 columnas del punto 2) para que se vea como la referencia: header con badge de tipo
   + badge "Crítica" (en vez de `Select` + checkbox sueltos) y peso destacado a la derecha,
   mantenido 100% editable.
6. **Filtros arriba en el ranking.** Hoy `ranking/page.tsx` solo tiene búsqueda por texto, sin
   filtros. Se agrega una fila de chips de filtro (por `match_category`: Alto/Medio/Bajo + "Todos",
   datos reales ya presentes en `CandidateListItem`) junto al buscador, arriba de la tabla.
7. **Drawer lateral con blur al abrir un candidato.** No existe ningún componente de panel
   lateral/slide-over en el proyecto (solo `modal.tsx`, centrado). Se crea
   `components/riwi/drawer.tsx` (panel fijo a la derecha, `max-w-md`, backdrop
   `backdrop-blur-sm bg-ink/30`, scroll-lock igual que `modal.tsx`, cierre con X/backdrop/Escape).
   Reemplaza el patrón actual de `ExpandedRow` inline-en-la-fila de `ranking/page.tsx` por este
   drawer, mismo contenido (resumen, fortalezas/brechas, breakdown).
8. **Sombra "neon" en vez de la actual.** Hoy `stat-card.tsx` solo aplica `shadow-tinted` (sombra
   violeta suave) cuando la card está `active`, junto a `border-l-4 border-primary` — es lo que el
   usuario señaló como "feo". Se agregan 5 clases de sombra neón en `globals.css`
   (`.shadow-neon-primary/mint/accent/blue/pink`, un glow real: `0 0 0 1px rgba(color,.45), 0 0
   22px 3px rgba(color,.5)`) y `StatCard` gana un prop `neon?: 'primary' | 'mint' | 'accent' |
   'blue' | 'pink'` (default `'primary'`) que sustituye `shadow-tinted` por `shadow-neon-{neon}`
   cuando `active`. Se actualizan los 2 callers con stat cards clicables (`dashboard/page.tsx`,
   `hiring-processes/page.tsx`) pasando el color que ya corresponde a cada card.
   `profiling/page.tsx` no tiene cards clicables (sin `active`), no aplica ahí; se elimina de
   todas formas al reescribirse por el punto 4.

## Archivos a tocar (por fase de ejecución)

**Fase A — tokens (puntos 1 y 8):**
- `app/globals.css` — tokens `--color-neutral`/`--color-neutral-light` (light+dark) y 5 clases
  `.shadow-neon-*`.
- `components/riwi/badge.tsx` (`StatusBadge` DRAFT), `components/riwi/stat-card.tsx` (prop
  `neon`), `app/(dashboard)/question-sets/page.tsx` y `[id]/page.tsx` (`STATUS_STYLES`
  DRAFT/ARCHIVED), `app/(dashboard)/settings/page.tsx` (badges inactivo/desconectado),
  `app/(dashboard)/hiring-processes/[id]/page.tsx` (paso pipeline "todo"),
  `app/(dashboard)/dashboard/page.tsx` y `hiring-processes/page.tsx` (prop `neon` en sus StatCard).

**Fase B — componentes nuevos (puntos 3 y 7):**
- `components/riwi/back-button.tsx` (nuevo).
- `components/riwi/drawer.tsx` (nuevo, inspirado en `modal.tsx` para scroll-lock/overlay).

**Fase C — Question Sets (puntos 2, 3, 5):**
- `components/riwi/question-builder.tsx` — tarjeta de pregunta rediseñada (badges tipo/crítica,
  peso destacado) + campo `eval_criteria` nuevo.
- `app/(dashboard)/question-sets/new/page.tsx` y `[id]/page.tsx` — layout 2 columnas +
  `BackButton`.

**Fase D — Ranking (puntos 6, 3, 7):**
- `app/(dashboard)/hiring-processes/[id]/ranking/page.tsx` — chips de filtro por
  `match_category`, `Drawer` reemplazando `ExpandedRow` inline, `BackButton`.

**Fase E — Kanban de ejecución de profiling (punto 4, incluye 3 en `[id]/page.tsx`):**
- `lib/types.ts` — `ProfilingBoardColumn`, `ProfilingBoardCard`, `ProfilingBoardResponse`;
  agregar `whatsapp_consent?: string` a `CandidateListItem` (informativo, no decide columna).
  Quitar `DualKanbanResponse`/`DualMatchCandidate` si nada más los usa tras la limpieza.
- `lib/api.ts` — nuevo `processesApi.getProfilingBoard()` (mock + real); quitar `getKanban` /
  `adaptCandidatesToKanban` / tipo `BackendCandidateListItem` si quedan huérfanos.
- `lib/data.ts` — limpiar `dualKanban` mock si ya no se usa.
- `app/(dashboard)/profiling/page.tsx` — reescrito completo: Kanban de 5 columnas (mismo patrón
  visual que el Kanban que se borra: `flex min-w-max gap-4` por columna), selección múltiple +
  "Iniciar llamadas de profiling" en la columna Cola.
- `app/(dashboard)/hiring-processes/[id]/candidates/page.tsx` — **eliminar**.
- `app/(dashboard)/hiring-processes/[id]/page.tsx` — quitar bloque "Ver candidatos", agregar
  `BackButton`.
- `components/riwi/floating-nav.tsx` — nuevo item en `NAV_ITEMS` ("Ejecución del profiling",
  `PhoneCall`, ruta `/profiling`).

## Verificación

- `npx tsc --noEmit` limpio en `.v0-preview/` tras cada fase.
- Servidor de dev (`npm run dev -- -p 3002`) sirviendo 200 en todas las rutas afectadas, revisando
  el log por errores de compilación/runtime.
- Con `NEXT_PUBLIC_USE_MOCK=false`, confirmar contra el backend real (mismo patrón usado en la
  sesión anterior: script Node con `axios` replicando las llamadas de `api.ts`) que
  `getProfilingBoard()` devuelve candidatos reales bucketeados correctamente por `status`, y que
  el filtro de ranking / drawer no rompen la carga de datos reales existente.
- Revisión visual: como no hay extensión de navegador conectada en este entorno, se deja
  explícito que la verificación visual final (colores grises vs cafés, sombra neón, drawer con
  blur, layout 2 columnas) requiere que el usuario la revise en `http://localhost:3002`.
