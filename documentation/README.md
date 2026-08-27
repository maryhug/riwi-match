# Portal de documentación del Frontend

Este sitio Docusaurus publica el contenido de `../docs`. Es un proyecto Node independiente de la
aplicación TanStack Start para que Azure DevOps construya y publique la documentación como un
artefacto estático propio.

```bash
npm install
npm run start
npm run build
```

El resultado de `npm run build` está en `build/`. El pipeline define `DOCS_URL` y, cuando se
publique bajo una subruta, `DOCS_BASE_URL`.
