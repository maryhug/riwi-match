---
sidebar_position: 5
---

# Desarrollo local

## Requisitos

- Node.js 20 o superior.
- API FastAPI accesible desde el proceso server de TanStack Start.

## Ejecución

```bash
npm install
cp .env.example .env
npm run dev
```

El desarrollo abre Vite en `http://localhost:8080`. `API_BASE_URL` se lee del lado servidor y suele
apuntar a `http://localhost:8000`; no debe usar `VITE_` ni `NEXT_PUBLIC_`.

## Comandos útiles

```bash
npm run lint
npm run typecheck
npm run build:railway
npm run test:components
npm run test:e2e
```

El build de Railway usa `vite.railway.config.ts` y el preset Nitro `node-server`. El build normal
no es sustituto de la validación del artefacto que se despliega.
