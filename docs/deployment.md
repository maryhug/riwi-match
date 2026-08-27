---
sidebar_position: 7
---

# Despliegue del frontend y BFF

Este repositorio se despliega de forma independiente del backend, pero no es un sitio estático: su
runtime Node ejecuta el BFF y debe alcanzar FastAPI. La guía complementaria de workers, Redis,
PostgreSQL y proveedores vive en el repositorio backend.

## Artefacto y proceso

El `Dockerfile` usa Node 22, instala con `npm ci`, ejecuta `npm run build:railway` y sirve el
artefacto Nitro con:

```bash
node .output/server/index.mjs
```

El proceso debe escuchar el `PORT` inyectado por la plataforma (`3000` es la referencia local del
contenedor). Para verificar exactamente el artefacto desplegable:

```bash
npm ci
npm run build:railway
node .output/server/index.mjs
```

El build normal no sustituye `build:railway`: este selecciona el preset Nitro `node-server` en
`vite.railway.config.ts`.

## Conectividad correcta

| Tramo | Configuración necesaria | Motivo |
| --- | --- | --- |
| Browser → frontend | Dominio HTTPS público del frontend. | Entrega UI y cookies de sesión. |
| Frontend/BFF → API | `API_BASE_URL` server-side, preferiblemente dominio privado del proveedor. | El Bearer se añade en el servidor; no se expone FastAPI al navegador. |
| Browser → archivos | Ruta `/dl/*` del frontend. | El proxy de descargas adjunta el JWT en servidor. |
| Proveedor externo → API | Dominio HTTPS público de la API, no el del frontend. | Meta, Twilio y ElevenLabs entregan webhooks a FastAPI. |

En Railway o en otro proveedor con red interna, usa una `API_BASE_URL` de red privada. Es correcto
porque TanStack Start corre en el servidor; un navegador no puede resolver ese dominio y nunca debe
recibirlo en una variable `VITE_*` o `NEXT_PUBLIC_*`.

## Variables mínimas

```text
NODE_ENV=production
API_BASE_URL=http://<dominio-privado-api>:<puerto-api>
```

No use `localhost` fuera de desarrollo. El valor se lee únicamente desde `process.env` en código
`*.server.ts` o una server function; cambiarlo requiere reiniciar/redeployar el runtime.

## Healthcheck y diagnóstico

Configura el healthcheck sobre `/` con un timeout suficiente para el arranque del servidor. El
servicio es responsable de los fallos de login visual, rutas, render SSR, cookies BFF y proxy de
descargas. Una pantalla que carga pero recibe un `ApiError` requiere revisar también la API y la
conectividad privada de `API_BASE_URL`.

| Síntoma | Primer servicio a revisar | Siguiente comprobación |
| --- | --- | --- |
| El dominio no carga o hay error SSR | Frontend | Logs runtime, `PORT`, `npm run build:railway` y healthcheck `/`. |
| Login carga pero autenticar falla | Frontend y API | `API_BASE_URL`, `/api/v1/auth/*`, cookies y logs de ambos servicios. |
| Descarga devuelve 401/404 | Frontend y API | Ruta `/dl/*`, sesión BFF y endpoint protegido en FastAPI. |
| El panel no refleja un proceso activo | Frontend, luego API/worker | Revalidación TanStack Query, endpoint de proyección y estado de Celery. |

## Portabilidad y CI/CD

Una plataforma distinta necesita un servicio Node con red privada hacia FastAPI, un dominio público
para la UI y variables de runtime (no build args) para `API_BASE_URL`. En Azure DevOps, construye
la aplicación y `documentation/` como artefactos separados; publica `documentation/build` en
hosting estático y conserva el despliegue del BFF como una etapa independiente.
