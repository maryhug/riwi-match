# AGENTS.md — Frontend (riwi-match)

Guía para agentes de IA: ver `CLAUDE.md` en este mismo directorio.

Lo imprescindible:

- Este repo tiene ramas de frontend con stacks distintos. `CLAUDE.md` describe la rama
  `feature/backend-integration` (TanStack Start + BFF real al backend FastAPI) — confirma con
  `git branch --show-current` antes de asumir esa arquitectura en otra rama.
- Toda llamada al backend pasa por `createServerFn` en `src/lib/api/*.functions.ts` — nunca
  fetch/axios directo desde un componente cliente. Los tokens JWT viven en cookies httpOnly, nunca
  en `localStorage`.
- No hay modo mock ni `mock-data.ts`. Si falta un dato real del backend, usa un estado vacío
  honesto en vez de inventarlo.
