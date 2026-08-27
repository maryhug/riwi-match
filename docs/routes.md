---
sidebar_position: 4
---

# Rutas y componentes

Las rutas se definen por archivo en `src/routes/`; `routeTree.gen.ts` se genera y no se edita a
mano.

| Área | Ruta o archivo principal |
| --- | --- |
| Sesión | `index.tsx`, `app.tsx` |
| Inicio | `app.index.tsx` |
| Procesos | `app.procesos.*` |
| Question Sets | `app.sets.*` |
| Profiling global | `app.profiling.tsx` |
| Administración | `app.admin.tsx`, `app.equipo.tsx` |
| Costos, búsqueda y equipo | `app.costos.tsx`, `app.buscar.tsx`, `app.equipo.tsx` |

Los componentes de negocio reutilizables viven en `src/components/app/`. Entre ellos están
`PipelineBoard`, `ProfilingResultModal`, `UploadCvsModal`, `SetBuilder`, `FloatingNav` y `Topbar`.
Los controles genéricos y accesibles pertenecen a `src/components/ui/`.

Los textos de UI, estados vacíos, toasts y foco de teclado se mantienen en español y accesibles.
