---
sidebar_position: 2
---

# Arquitectura del frontend y BFF

El stack es TanStack Start, TanStack Router file-based, React 19, TypeScript 5, Vite 7, Tailwind 4
y TanStack Query.

```text
Browser -> rutas/componentes -> createServerFn -> client.server.ts -> FastAPI
                                      |                |
                                      +-> cookies httpOnly / refresh controlado
```

## Límites de responsabilidad

- Los componentes no hacen `fetch` directo a FastAPI.
- `src/lib/api/client.server.ts` adjunta cookies y prueba un único refresh ante 401.
- `src/lib/api/*.functions.ts` valida entrada y expone funciones para cada dominio.
- Descargas autenticadas y CSV recorren `/dl/*` mediante `download-proxy.server.ts`; un JWT no se
  pone en una query string.
- Los datos remotos se cachean con TanStack Query. La pantalla Home usa endpoints paginados y
  agregados, no un N+1 de detalles de procesos.

La configuración por proceso solo muestra plantilla/mensaje de WhatsApp y agente de voz. Prompts
globales de extracción, match, mejora de JD y evaluación pertenecen a Admin.
