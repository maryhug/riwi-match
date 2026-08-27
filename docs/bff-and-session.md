---
sidebar_position: 3
---

# BFF, sesión y descargas protegidas

El frontend no expone la URL interna del backend ni los JWT al código de componentes. El límite
está en `src/lib/api/client.server.ts`, ejecutado por el runtime server de TanStack Start.

```text
Componente o loader
  -> createServerFn de src/lib/api/*.functions.ts
  -> apiCall()
  -> FastAPI con Authorization: Bearer (solo en servidor)
```

## Cookies y autoridad

| Cookie | Atributos | Propósito |
| --- | --- | --- |
| `rm_access` | `httpOnly`, `SameSite=Lax`, una hora | JWT de acceso enviado por el BFF. |
| `rm_refresh` | `httpOnly`, `SameSite=Lax`, siete días | Renovación controlada de la sesión. |
| `rm_user` | No `httpOnly`, `SameSite=Lax`, siete días | Hint visual de nombre/rol; no autoriza acciones. |

En producción las cookies son `secure`; todas usan `path=/`. Nunca se usan `localStorage`, query
params ni variables públicas para un token. El backend conserva la decisión de rol, propiedad y
permisos aunque el browser pueda leer `rm_user`.

## Una petición al backend

`apiCall()` añade `Authorization` cuando corresponde, serializa JSON o `FormData`, trata `204` y
normaliza el detalle de error en `ApiError`. Ante un `401` intenta exactamente un refresh contra
`/api/v1/auth/refresh`; si falla, borra las tres cookies. No hace bucles de refresh ni repite una
petición tras cualquier otro error.

`API_BASE_URL` se lee con `process.env` en el servidor. Una pantalla no debe importar este valor,
ni llamar `fetch` directamente al backend.

## Archivos y CSV

`src/lib/download-proxy.server.ts` y las rutas `/dl/*` resuelven descargas autenticadas desde el
servidor y adjuntan el Bearer allí. Esta separación evita filtros o tokens en la URL y mantiene el
browser alejado de FastAPI.

## Cómo añadir una operación BFF

1. Confirma endpoint, roles y payload en OpenAPI/router del backend.
2. Actualiza `src/lib/types/api.ts` o `enums.ts` si el contrato cambió.
3. Añade una `createServerFn` validada en el archivo del dominio correspondiente.
4. Invócala desde loader, acción o componente; no implementes un cliente paralelo.
5. Prueba respuesta correcta, vacío, error, permisos y renovación de sesión cuando aplique.
