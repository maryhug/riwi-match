---
sidebar_position: 3
---

# Datos, contratos y estado

Antes de cambiar una pantalla, confirma el router/OpenAPI del backend y actualiza los tipos de
`src/lib/types/`. No se inventan campos de negocio para suplir respuestas incompletas.

## Home eficiente

La vista inicial se basa en tres endpoints:

| Endpoint | Propósito |
| --- | --- |
| `/api/v1/processes/home` | Tarjetas y listado paginado/filtrado. |
| `/api/v1/processes/home/options` | Opciones de filtros disponibles. |
| `/api/v1/metrics/home` | Métricas agregadas independientes de la página visible. |

Los estados `CLOSED` y `ARCHIVED` se excluyen por defecto, pero son recuperables mediante filtro.

## Pipeline y profiling

El frontend consume la proyección central del backend. El tablero global es solo de profiling y
mantiene una tarjeta por candidato. No se deben calcular columnas, contadores ni estados efectivos
distintos en cada pantalla.

Al abrir un resultado de profiling, `ProfilingResultModal` vuelve a pedir el detalle para mostrar
audio, transcript y costos actuales.
