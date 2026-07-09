<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Plan de cierre del MVP

**El plan para llevar F1–F3 al 100% está en `PLAN_MVP_100.md`, en la raíz del monorepo (repo padre
`RiwiMatch`, un nivel arriba de este submódulo).** Consúltalo antes de priorizar trabajo nuevo:
lista cada brecha con los archivos de frontend y backend a tocar.

Notas de estado (2026-07-08): `src/lib/api.ts` está 100% conectado al backend real — **no existe
modo mock** (`src/lib/mockData.ts` es código muerto pendiente de eliminar y `NEXT_PUBLIC_USE_MOCK`
no se lee en ninguna parte). Las skills de `.claude/skills/` documentan los patrones de integración
(adapters, estados de UI, modales de upload/preview, URLs autenticadas).
