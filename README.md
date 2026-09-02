<div align="center">
  <img src="./src/assets/CurvaMatch.svg" alt="RIWI MATCH" width="360" />
  <h1>Frontend & BFF</h1>
  <p>Interfaz autenticada y capa BFF de RIWI MATCH.</p>

  <img src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TanStack_Start-BFF-FF4154?logo=tanstack&logoColor=white" alt="TanStack Start" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</div>

## Qué contiene

Aplicación TanStack Start con React, rutas file-based y TanStack Query. El navegador no llama a
FastAPI directamente: las server functions forman un BFF que mantiene los JWT en cookies `httpOnly`
y añade el Bearer solo en el runtime server.

```text
Browser -> rutas y componentes -> createServerFn -> BFF -> FastAPI
```

Incluye inicio paginado, procesos, carga/análisis de CV, match, Question Sets, profiling, costos,
búsqueda, equipo y administración según rol.

## Inicio local

```bash
npm install
cp .env.example .env
npm run dev
```

Abre <http://localhost:8080>. `API_BASE_URL` debe apuntar a FastAPI desde el proceso server de
TanStack Start; no uses `VITE_`, `NEXT_PUBLIC_`, `localhost` remoto ni tokens en el navegador.

Para validar el artefacto Node desplegable:

```bash
npm run build:railway
node .output/server/index.mjs
```

## Documentación

El portal Docusaurus vive en [`documentation/`](documentation/README.md) y publica el contenido de
[`docs/`](docs/).

| Tema | Referencia |
| --- | --- |
| Arquitectura y sesión | [Arquitectura](docs/architecture.md) · [BFF y sesión](docs/bff-and-session.md) |
| Funciones y contratos | [Server functions](docs/server-functions.md) · [Datos](docs/data-and-contracts.md) |
| Rutas y componentes | [Rutas](docs/routes.md) |
| Entrega y calidad | [Despliegue](docs/deployment.md) · [Pruebas](docs/testing.md) |

Para navegarlo localmente:

```bash
cd documentation
npm install
npm run start
```

## Inicio de sesión con Órbita

El login conserva email/contraseña y ofrece “Continuar con Órbita”. El BFF implementa dos rutas HTTP:

- `/auth/orbita/login`: genera un `state` aleatorio en cookie HTTP-only y solicita al API la URL
  de autorización.
- `/auth/orbita/callback`: consume `state`, entrega el código al API de Match y crea las cookies
  locales `rm_access`, `rm_refresh` y `rm_user` antes de redirigir a `/app`.

El navegador nunca recibe el `client_secret` ni conserva el código/JWT de Órbita. La única variable
del frontend sigue siendo `API_BASE_URL`; toda variable `ORBITA_SSO_*` pertenece al servicio API.


## Calidad

```bash
npm run lint
npm run typecheck
npm run build:railway
npm run test:components
npm run test:e2e
```

Los mocks de Playwright no representan una integración real. Para validarla se requiere FastAPI,
PostgreSQL, Redis y las credenciales autorizadas del proveedor correspondiente.
