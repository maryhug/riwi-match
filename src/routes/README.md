# Rutas TanStack Start

Esta carpeta usa file-based routing. No crear `src/pages`, `app/layout.tsx` ni estructuras de
Next.js/Remix. `__root.tsx` es el shell global y `app.tsx` protege `/app/*`.

| Archivo | URL |
| --- | --- |
| `index.tsx` | `/` (login) |
| `app.index.tsx` | `/app` |
| `app.procesos.nuevo.tsx` | `/app/procesos/nuevo` |
| `app.procesos.$id.tsx` | `/app/procesos/:id` |
| `app.sets.index.tsx` | `/app/sets` |
| `app.sets.$id.tsx` | `/app/sets/:id` |
| `app.profiling.tsx` | `/app/profiling` |
| `app.costos.tsx` | `/app/costos` |
| `app.equipo.tsx` | `/app/equipo` |
| `app.buscar.tsx` | `/app/buscar` |
| `app.admin.tsx` | `/app/admin` |

Las rutas deben consumir server functions, manejar acceso por rol y conservar estados de carga,
vacío y error. `routeTree.gen.ts` es generado: no editarlo manualmente.
