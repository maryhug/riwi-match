---
name: backend-response-adapter
description: Úsala en riwi-match (rama de integración) cuando la shape que devuelve el backend no coincide con la que consume la UI — estados con nombres distintos, lista plana vs Kanban, campos partidos como name/last_name. Centraliza la traducción en funciones adapter dentro de api.ts y mantén separados los tipos Backend* de los tipos del front, para no esparcir mapeos frágiles por las páginas.
---

# Capa de adaptación backend → front (riwi-match)

El backend y el front tienen **contratos distintos**. La regla es traducir en un solo lugar:
la sección `// ─── Adapters ───` de `src/lib/api.ts`. Las páginas nunca deben conocer la
shape cruda del backend ni hacer mapeos ad-hoc.

## Regla de tipos: Backend* vs Front (en `src/lib/types.ts`)

Define **dos** familias de tipos y no las mezcles:

- **`BackendXxx` / `XxxResponse`** — exactamente lo que devuelve la API. Ej.:
  `BackendProcessStatus`, `BackendCandidateStatus`, `ProcessesListResponse`, `ProcessDetail`,
  `CandidateListResponse`, `MatchStatusResponse`.
- **`Xxx` (front)** — lo que consumen los componentes. Ej.: `HiringProcess`, `ProcessStatus`,
  `DualKanbanResponse`, `DualMatchCandidate`.

Un adapter es siempre `Backend → Front`.

## Anatomía de un adapter

Vive en `api.ts` y se aplica al resolver la promesa del endpoint:

```ts
get: (id: string) =>
  api.get<ProcessDetail>(`/api/v1/processes/${id}`)
     .then((r) => ({ data: adaptProcessDetail(r.data) })),
```

Escribe la función pura arriba, con un comentario que documente el mapeo. Modelos reales:

- **`adaptStatus(s)`** — mapea el enum de estado del backend al del front con un `Record` y un
  fallback seguro. Es el ejemplo canónico:
  ```ts
  // Backend: DRAFT | CVS_UPLOADED | MATCH_PROCESSING | MATCH_DONE | PROFILING_* | CLOSED | ARCHIVED
  // Front:   DRAFT | READY_FOR_MATCH | CVS_UPLOADED | MATCHING | PROFILING_CONFIGURED | COMPLETED
  const map: Record<string, HiringProcess['status']> = { MATCH_DONE: 'PROFILING_CONFIGURED', /* ... */ };
  return map[s] ?? 'DRAFT';   // ← SIEMPRE un fallback: nunca dejes que un estado nuevo del back rompa la UI
  ```
- **`adaptProcess` / `adaptProcessDetail`** — renombran campos (`process_id → id`), rellenan
  faltantes con defaults (`budget_max_usd ?? 0`, `recruiter_id: ''`) y delegan el estado en
  `adaptStatus`.
- **`adaptCandidatesToKanban(candidates)`** — transforma la **lista plana** del backend a los
  buckets que espera la UI: `{ HIGH, MEDIUM, LOW, LOADED, PARSING }`. Aquí vive la lógica de
  clasificación (por `status` + `match_category`) y el gotcha de partir el nombre:
  `name.split(' ')` → `name` / `last_name`.

## Cuándo NO necesitas adapter

Si la shape del backend coincide 1:1 con la del front, devuelve directo
(`api.get<T>(...)` sin `.then` de traducción). No inventes adapters innecesarios.

## Checklist al añadir/editar un adapter

1. ¿Existe el tipo `BackendXxx`/`XxxResponse` que refleja la API real? Si no, créalo en `types.ts`.
2. ¿El adapter es una función pura en la sección `Adapters` de `api.ts`, con comentario del mapeo?
3. ¿Los mapeos de enum tienen **fallback** (`?? valorSeguro`) para estados/categorías nuevas?
4. ¿Los campos que el backend no envía se rellenan con defaults explícitos, no `undefined` colado?
5. ¿La página consume solo el tipo Front y desconoce la shape cruda?

Para conectar un endpoint nuevo de punta a punta (axios + hook + queryKey), combina con
[[add-api-endpoint-with-query]].

## Verificación

- Con el backend arriba, la entidad se renderiza correctamente y un estado desconocido del
  backend cae en el fallback sin romper la vista.
- `npm run lint` sin errores; sin `any` sueltos en la frontera Backend/Front.
