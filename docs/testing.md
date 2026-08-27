---
sidebar_position: 6
---

# Pruebas y calidad

Playwright cubre componentes y rutas con una API mock controlada desde `tests/fixtures/mock-api.mjs`.
Los mocks no son parte del runtime de la aplicación.

| Comando | Cobertura |
| --- | --- |
| `npm run lint` | Reglas estáticas de JavaScript/TypeScript. |
| `npm run typecheck` | Tipos sin emitir artefactos. |
| `npm run test:components` | Componentes, estados de negocio y accesibilidad. |
| `npm run test:e2e` | Rutas, roles y flujos sobre API mock. |
| `npm run build:railway` | Artefacto Node/Nitro de Railway. |

Cuando cambie un contrato, prueba camino exitoso, vacío, error, permisos, paginación, filtros,
revalidación y campos omitidos/nulos. Para declarar integración real hay que comprobar además la
API, base de datos y proveedores correspondientes.
