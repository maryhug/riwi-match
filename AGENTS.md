# AGENTS.md — Frontend

Reglas para `riwi-match` en la rama de integración TanStack Start.

- Lee `CLAUDE.md` y `README.md`.
- Componentes nunca hacen `fetch` directo a FastAPI. Usa `src/lib/api/*.functions.ts` y
  `client.server.ts`.
- Los JWT viven en cookies httpOnly; no uses `localStorage` ni query params para tokens.
- Contratos se reflejan en `src/lib/types/api.ts`/`enums.ts`; verifica primero OpenAPI/router.
- Home consume endpoints paginados/agregados. No hidrates todos los procesos ni hagas N+1 de
  detalles para construir la vista Admin.
- Configuración por proceso muestra solo WhatsApp y agente de llamada. El saludo está en la
  plantilla de voz y Question Set no tiene prompt.
- No inventes datos de negocio. Los mocks viven únicamente en Playwright/tests.
- UI, toasts y estados vacíos en español; conserva accesibilidad de teclado, labels y foco.
- `routeTree.gen.ts` es generado y no se edita a mano.

QA:

```bash
npm run lint
npm run typecheck
npm run build:railway
npm run test:components
npm run test:e2e
```

Commitea este submódulo antes de actualizar el puntero del repositorio padre.
