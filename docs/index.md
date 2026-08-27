---
sidebar_position: 1
slug: /
---

# Frontend de RIWI MATCH

Este repositorio implementa la interfaz autenticada y el BFF de RIWI MATCH con TanStack Start,
React, Vite y TypeScript. La aplicación no consume FastAPI desde componentes del navegador.

## Fuente de verdad

- Los contratos se derivan de OpenAPI y se reflejan en `src/lib/types/api.ts` y
  `src/lib/types/enums.ts`.
- Las server functions de `src/lib/api/*.functions.ts` son el límite entre rutas/componentes y el
  cliente FastAPI server-only.
- Las decisiones de permisos y propiedad pertenecen al backend; el frontend solo mantiene la
  sesión en cookies `httpOnly`.

## Mapa rápido

| Área | Punto de entrada |
| --- | --- |
| Rutas y loaders | `src/routes/` |
| BFF y contratos | `src/lib/api/`, `src/lib/types/` |
| Sesión y descargas | `src/lib/auth-context.tsx`, `src/lib/download-proxy.server.ts` |
| Componentes de negocio | `src/components/app/` |
| Primitives visuales | `src/components/ui/` |
| Pruebas | `tests/` y configuración Playwright |
