---
name: manejar-estados-ui
description: Úsala en riwi-match al construir UI que dependa del estado de un proceso o candidato — badges, habilitar/deshabilitar acciones, buckets del Kanban, polling hasta estado terminal. Documenta el vocabulario de estados del front vs backend, cómo se traducen, qué acciones habilita cada estado y qué reglas RB afectan la UI. El backend es la fuente de verdad; la UI solo refleja y previene, nunca decide la transición.
---

# Manejar estados de proceso/candidato en la UI (riwi-match)

> El backend es la **fuente de verdad** de los estados y sus transiciones (ver la skill de
> backend [[maquina-de-estados]]). La UI **refleja** el estado y **previene** acciones
> inválidas para mejor UX, pero toda acción real la valida el backend, que puede responder
> `422 BusinessRuleException`. Maneja siempre ese error y refresca el estado.

## Vocabulario: front vs backend

El front usa un enum de estados **propio**, más chico que el del backend. La traducción vive
en `adaptStatus` (sección Adapters de `src/lib/api.ts`) — nunca compares contra strings crudos
del backend en las páginas; consume el estado ya adaptado. Ver la skill [[backend-response-adapter]].

- Proceso (front): `DRAFT | READY_FOR_MATCH | CVS_UPLOADED | MATCHING | PROFILING_CONFIGURED | COMPLETED`.
  El backend (`DRAFT | CVS_UPLOADED | MATCH_PROCESSING | MATCH_DONE | PROFILING_* | CLOSED | ARCHIVED`)
  se mapea con fallback seguro a `DRAFT`.
- Candidato: la lista plana del backend se agrupa en buckets de Kanban
  `{ HIGH, MEDIUM, LOW, LOADED, PARSING }` en `adaptCandidatesToKanban`. La categoría
  (`match_category`) decide HIGH/MEDIUM/LOW solo cuando el status es `MATCHED`; `CV_PROCESSING`/
  `MATCH_PROCESSING` caen en `PARSING`; el resto en `LOADED`.

## Habilitar/deshabilitar acciones por estado

Espeja las guardas del backend para no ofrecer botones que el backend va a rechazar:

| Acción UI | Habilitar cuando (front) | Guarda backend equivalente |
|-----------|--------------------------|----------------------------|
| Subir CVs | proceso no COMPLETED | `can_upload_cvs` |
| Ejecutar match | hay JD y CVs cargados | `can_run_match` + RB-001 (JD) |
| Configurar/iniciar profiling | hay set de preguntas asignado | `can_start_profiling` + RB-003 |
| Iniciar llamadas | hay ≥1 candidato seleccionado manualmente | RB-004 |
| Cualquier modificación | proceso no CLOSED/ARCHIVED (`COMPLETED` en front) | RB-009 (`is_active`) |

Reglas RB que se ven en la UI:
- **RB-001** — deshabilita "Ejecutar match" y muestra aviso si no hay JD.
- **RB-002** — un candidato en `LOADED`/`PARSING`/`CV_ERROR` no se rankea; en el Kanban va a
  `PARSING`/`LOADED`, no a un bucket de match.
- **RB-003** — el botón de profiling solo se habilita con set de preguntas.
- **RB-004** — "Iniciar profiling" requiere selección manual (checkbox) de candidatos.
- **RB-008** — un candidato `DISCARDED` puede revertirse a `MATCHED` desde la UI (acción de
  recruiter); nunca se descarta solo.
- **RB-009** — un proceso cerrado deshabilita todas las acciones de modificación.

## Polling hasta estado terminal

Cuando esperas trabajo de workers Celery (parseo de CV, match), **no uses un intervalo fijo**:
usa `refetchInterval` como función que se detiene al llegar a estado terminal, para no
martillar el backend. Estados terminales de candidato para efectos de UI:
`MATCHED`, `CV_ERROR`, `DISCARDED`, `PROFILING_COMPLETED`, `PROFILING_FAILED`.

```ts
useQuery({
  queryKey: ['candidates', id],
  queryFn: () => processesApi.getCandidatesList(id).then((r) => r.data),
  refetchInterval: (q) => {
    const cands = q.state.data?.candidates ?? [];
    const pendiente = cands.some(
      (c) => !['MATCHED', 'CV_ERROR', 'DISCARDED', 'PROFILING_COMPLETED', 'PROFILING_FAILED'].includes(c.status),
    );
    return pendiente ? 5000 : false;
  },
});
```

A nivel de proceso, `processesApi.getMatchStatus(id)` expone `progress_pct` e `is_complete`
para barras de progreso; corta el polling cuando `is_complete`.

## Al ejecutar una acción de transición

1. Deshabilita el control si la guarda de estado no se cumple (feedback inmediato).
2. Dispara la mutación vía `api.ts` (nunca `fetch` directo — ver [[add-api-endpoint-with-query]]).
3. En `onError`, si es `422`, muestra el mensaje de la `BusinessRuleException` del backend.
4. En `onSuccess`/`onError`, invalida las queries del proceso/candidatos para releer el estado real.

## Verificación

- Con el backend arriba: los botones se habilitan/deshabilitan según el estado; una acción
  inválida devuelve 422 y la UI muestra el mensaje sin romperse.
- El polling se detiene cuando todos los candidatos llegan a estado terminal.
- `npm run lint` sin errores.
