# CLAUDE.md — Frontend RIWI MATCH

Frontend/BFF de RIWI MATCH. Lee primero [`AGENTS.md`](AGENTS.md).

## Stack y ejecución

- TanStack Start + TanStack Router file-based.
- React 19, TypeScript 5, Vite 7 y Tailwind 4.
- TanStack Query para cache/revalidación.
- Desarrollo con Vite en `http://localhost:8080`.
- Railway construye con `vite.railway.config.ts`, preset Nitro `node-server`, y sirve en `:3000`.
- El build normal conserva el preset configurado por el proyecto; para validar el artefacto que se
  despliega en Railway usa siempre `npm run build:railway`.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build:railway
npm run test:components
npm run test:e2e
```

`API_BASE_URL` se lee únicamente server-side. No uses `VITE_`, `NEXT_PUBLIC_` ni una URL pública
directa desde el browser.

## Patrón BFF

`src/lib/api/client.server.ts` es el único cliente FastAPI. Las server functions por dominio
viven en `src/lib/api/*.functions.ts`, validan input y adjuntan cookies JWT httpOnly. Ante 401 el
cliente intenta refresh una sola vez. `rm_user` es solo un hint visual; backend conserva la
autoridad de roles/ownership.

Los archivos/CSV navegan por `src/lib/download-proxy.server.ts` y rutas `/dl/*`, que adjuntan el
Bearer en servidor. Nunca pongas JWT en query strings.

## Datos de inicio

La pantalla Home usa:

- `/api/v1/processes/home`: tarjetas/listado paginados y filtrados;
- `/api/v1/processes/home/options`: recruiters/áreas/etapas disponibles;
- `/api/v1/metrics/home`: resumen agregado independiente de la página.

Búsqueda y filtros se envían al backend. `CLOSED`/`ARCHIVED` no cargan por defecto, pero se pueden
seleccionar. No reemplaces esto por `listProcesses()` + detalles/metrics por cada id; ese patrón
degrada severamente la vista Admin.

## Configuración de procesos

La sección de comunicación permite:

- elegir una plantilla WhatsApp aprobada/habilitada;
- editar/restaurar el comportamiento `WHATSAPP_MESSAGE`;
- ver/editar según permisos el agente `VOICE_CALL_AGENT`, con `first_message` y contenido.

No muestres por proceso extracción, match, mejora de JD ni evaluación de profiling; son ajustes
globales de Admin. No atribuyas el saludo al Question Set y no recrees `default_first_message`.

## Componentes y navegación

- Rutas en `src/routes/`; `routeTree.gen.ts` se regenera.
- Componentes de negocio en `src/components/app/`; primitives en `src/components/ui/`.
- `FloatingNav` soporta modo compacto temporal y bloqueo expandido persistido.
- `ProfilingResultModal` solicita el detalle fresco para mostrar transcript/audio/costos.
- El board global de profiling es profiling-only y mantiene una tarjeta por candidato.

## QA y datos

Los mocks (`tests/fixtures/mock-api.mjs`) son exclusivos de Playwright. La aplicación no tiene modo
mock. Component tests cubren piezas de negocio/accesibilidad; E2E cubre rutas, roles, home y
flujos con API mock. Para afirmar integración real, valida además FastAPI/DB/proveedores.

Cuando cambie un contrato, prueba happy path, vacío, error, permisos, paginación, filtros,
revalidación y valores omitidos/null. No derives totales globales de la página visible.
