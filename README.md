# RIWI MATCH Frontend

Frontend autenticado y BFF de RIWI MATCH, construido con TanStack Start, React 19, TypeScript,
Vite y Tailwind 4.

## Ejecutar

```bash
npm install
cp .env.example .env
npm run dev
```

Desarrollo: <http://localhost:8080>. `API_BASE_URL` debe apuntar al FastAPI accesible desde el
proceso server de TanStack Start (normalmente `http://localhost:8000`).

El contenedor/Railway usa:

```bash
npm run build:railway
node .output/server/index.mjs
```

y sirve en el puerto 3000 o el puerto del ambiente.

## Arquitectura

- `src/routes/`: rutas file-based y loaders.
- `src/lib/api/`: server functions por dominio y cliente FastAPI server-only.
- `src/lib/types/`: contratos y enums reflejados del backend.
- `src/components/app/`: componentes de negocio.
- `src/components/ui/`: primitives compartidos.
- `src/lib/download-proxy.server.ts`: descargas autenticadas sin exponer JWT.

El browser no llama FastAPI directamente. La sesión usa cookies httpOnly y la autorización final
siempre la decide el backend.

## Pantallas

- Inicio paginado con búsqueda/filtros y métricas agregadas.
- Procesos: dashboard, ranking, kanban y configuración.
- Question Sets sin system prompts.
- Profiling global y resultados completos.
- Costos auditables, equipo, búsqueda y administración según rol.

En proceso, la comunicación reúne plantilla/mensaje WhatsApp y agente de voz (saludo + contenido).
Los prompts de extracción, match, mejora de JD y evaluación solo aparecen en Admin global.

## QA

```bash
npm run lint
npm run typecheck
npm run build:railway
npm run test:components
npm run test:e2e
```

Playwright usa una API mock controlada para componentes/E2E. Eso valida el frontend, no sustituye
una prueba integrada con backend, DB o proveedores.

Consulta [`AGENTS.md`](AGENTS.md) y [`CLAUDE.md`](CLAUDE.md) antes de editar.
