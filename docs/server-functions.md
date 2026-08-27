---
sidebar_position: 4
---

# Mapa de server functions

Cada archivo de `src/lib/api/*.functions.ts` agrupa `createServerFn` por dominio. Son el contrato
de uso interno del frontend: rutas y componentes deben depender de ellas, no de paths de FastAPI
escritos a mano.

| Archivo | Funciones y responsabilidad |
| --- | --- |
| `auth.functions.ts` | `login`, `logout`, `getSession`; crea, lee o limpia la sesión BFF. |
| `processes.functions.ts` | Home paginado, CRUD de procesos, JD, configuración, métricas y progreso. |
| `candidates.functions.ts` | Carga, análisis explícito, detalle, edición, descarte/restauración y consentimiento. |
| `match.functions.ts` | Solicita match manual y consulta su estado. |
| `profiling.functions.ts` | Inicio, historial, pipeline, board global, detalle, cancelación y override. |
| `question-sets.functions.ts` | CRUD de sets y de sus preguntas. |
| `ai-config.functions.ts` | Modelos, prompts y settings globales de Admin. |
| `whatsapp-templates.functions.ts` | Plantillas administrativas, seleccionables, sincronización y edición. |
| `metrics.functions.ts`, `reports.functions.ts` | Métricas agregadas y dashboard de TA. |
| `users.functions.ts`, `audit.functions.ts`, `notifications.functions.ts` | Administración, auditoría y bandeja de notificaciones. |
| `search.functions.ts`, `system.functions.ts`, `ai-feedback.functions.ts` | Búsqueda global, salud de integraciones y feedback. |

`example.functions.ts` es una muestra de `createServerFn`, no un servicio de negocio.

## Reglas de uso por pantalla

- Home usa `getHomeProcesses`, `getProcessOptions` y `getHomeMetrics`; no compone la vista con
  `getProcesses` seguido de detalles por cada proceso.
- Las mutaciones invalidan o revalidan la consulta TanStack Query afectada; no actualizan totales
  globales solo con la página visible.
- Los parámetros deben pasar el validador de la server function. No se acepta un `any` para
  esquivar un cambio de contrato.
- Las operaciones costosas (análisis, match, profiling) se expresan como intención del usuario;
  la UI no las encadena automáticamente.

## Diferencia con OpenAPI

OpenAPI describe el contrato entre BFF y backend. Las server functions añaden seguridad de sesión,
validación de entrada y una interfaz tipada para React. Si un endpoint cambia, se actualizan ambos
bordes: tipos/BFF y la pantalla que lo consume.
