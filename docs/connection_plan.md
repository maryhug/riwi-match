# Plan de conexión Frontend ↔ Backend — RIWI MATCH

Auditoría de toda la interfaz interactiva (páginas bajo `src/app/(auth)` y
`src/app/(dashboard)`, más componentes reutilizables con acciones). Objetivo:
identificar qué está realmente conectado al backend, qué usa datos falsos/mock,
qué está roto, y qué no tiene ningún handler.

**Etiquetas usadas:** `conectado` · `mockeado` · `roto` · `sin-implementar`

> Nota de arquitectura (importante, contradice CLAUDE.md): `src/lib/api.ts` **no
> tiene ningún mecanismo de fallback a mocks**. No existe ninguna referencia a
> `NEXT_PUBLIC_USE_MOCK` en todo `src/`, y `src/lib/mockData.ts` (1137 líneas) no
> se importa desde ningún archivo — es código muerto completo. Si se necesita el
> modo mock descrito en la documentación del repo, hay que reconstruirlo desde
> cero; hoy toda función de `api.ts` o pega contra el backend real o es un stub
> que devuelve una promesa resuelta con datos vacíos/fijos.

---

## 1. `src/lib/api.ts` — auditoría función por función

| Export | Pega al backend real | ¿Se usa en algún componente? | Estado |
|---|---|---|---|
| `authApi.login` | Sí (`POST /auth/login`) | `login/page.tsx` | conectado |
| `processesApi.list/create/get` | Sí | dashboard, hiring-processes, new, `[id]` | conectado |
| `processesApi.getJD/saveJD/uploadJDFile/getJDFileUrl` | Sí | `[id]/page.tsx` (JDStep), `new/page.tsx` (Step2) | conectado |
| `processesApi.parseJD` | **No** — `Promise.resolve` local, solo trunca `rawText` a 300 chars, no llama IA | `[id]/page.tsx` botón "Analizar con IA" | **mockeado/roto** (el label promete IA, no hace nada real) |
| `processesApi.uploadCandidates/startMatch/getMatchStatus` | Sí | new, `[id]`, `UploadCvsModal` | conectado |
| `processesApi.getKanban/getCandidatesList/getCandidateDetail` | Sí | candidates (kanban), ranking | conectado |
| `processesApi.getCvFileUrl/getNormalizedCvFileUrl` | Sí (URL con `?token=`) | ranking, `[id]` | conectado |
| `processesApi.startProfiling` | **No** — stub `{status:'not_available'}`, no llama nada | kanban ("Iniciar profiling"), ranking ("Activar profiling") | **sin-implementar** (el backend no expone el endpoint aún; el botón hace una llamada fake que "success"ea sin efecto real) |
| `processesApi.getProfilingRuns` | **No** — stub `[]` fijo | `[id]/page.tsx` ProfilingStep | **sin-implementar** |
| `candidatesApi.updateNotes/updateStatus` | **No** — stubs `Promise.resolve({data:{}})` | **Ningún componente los llama** | código muerto / sin-implementar |
| `questionSetsApi.*` (list/get/create/update/delete/addQuestion/updateQuestion/deleteQuestion) | Sí, todo | question-sets (list, new, `[id]`) | conectado |
| `settingsApi.*` (getModels/setActiveModel/getPrompts/updatePrompt/getGlobalSettings/updateThresholds) | **No** — todos stubs vacíos | **Ningún componente los llama** (settings/page.tsx no importa `settingsApi`) | código muerto |
| `metricsApi.getDashboard` | **No** — stub con ceros/arrays vacíos | `metrics/page.tsx` | mockeado (conectado vía useQuery pero el dato es siempre 0) |

**Hallazgo clave:** el `ranking/page.tsx` (`OverrideSection.save`, línea ~467-483)
hace un `fetch('/api/v1/processes/.../override', ...)` **directo, sin pasar por
el cliente axios de `api.ts`** y sin `BASE_URL` — es una URL relativa que golpea
el servidor Next.js, no el backend FastAPI en `localhost:8000`. Esto está roto
salvo que exista un rewrite/proxy configurado (no se encontró ninguno). Además
duplica la lógica de auth header manualmente en vez de reusar el interceptor de
`api.ts`, y no existe función equivalente expuesta en `api.ts` (debería ser
`candidatesApi.updateOverride` o similar, reemplazando los stubs muertos
`updateNotes`/`updateStatus`).

---

## 2. Login / Auth — `src/app/(auth)/login/page.tsx`

| Elemento | Línea | Estado actual | Acción de negocio esperada |
|---|---|---|---|
| Form "Ingresar" (email+password) | ~92-131 | `authApi.login` real, guarda token/rol, redirige a `/dashboard` | conectado |
| Link "¿Olvidaste tu contraseña?" → vista `forgot` | ~120-127 | Solo cambia estado local `view` | conectado (navegación interna, ok) |
| Form "Enviar enlace de recuperación" (`handleRecover`) | ~51-59, 172-189 | **No llama ningún endpoint** — `setTimeout(800ms)` y pasa a vista "sent" | **sin-implementar**: debería llamar a un endpoint tipo `POST /auth/forgot-password` |
| Botón "Volver al inicio de sesión" | ~201-203 | Solo cambia estado | conectado (ok) |
| Botón "Acceso rápido" (autocompletar recruiter) | ~137-144 | Rellena el form con credenciales de demo | conectado (ok, es una ayuda de desarrollo) |

---

## 3. Dashboard — `src/app/(dashboard)/dashboard/page.tsx`

Vista de solo lectura. `processesApi.list()` conectado. Tabla de recientes,
gráfico por área y por estado — todo derivado de datos reales. Links "Ver →",
"Ver todos", "Crear el primero →" son navegación (`Link`), conectados. Sin
botones de acción propios más allá de navegación.

---

## 4. Hiring Processes — listado — `hiring-processes/page.tsx`

| Elemento | Línea | Estado | Acción esperada |
|---|---|---|---|
| Botón "Nuevo proceso" | ~79-82 | Link a `/hiring-processes/new` | conectado |
| Buscador + filtro de estado | ~105-119 | Filtra en memoria sobre datos reales | conectado |
| Botón "Ver →" por fila | ~35-39 | Link a `/hiring-processes/[id]` | conectado |
| Botón "···" (MoreHorizontal) por fila | ~40-42 | **Sin `onClick`**, no hace nada | **sin-implementar** — debería abrir menú (duplicar/archivar/eliminar proceso) |

---

## 5. Hiring Processes — creación (wizard) — `hiring-processes/new/page.tsx`

Los 3 pasos están completamente conectados:
- Step1 "Siguiente" → `processesApi.create` (incluye pesos de match opcionales) — conectado.
- Step2 "Guardar JD" → `processesApi.uploadJDFile` o `saveJD` según modo — conectado. "Omitir por ahora" solo avanza de paso (ok).
- Step3 "Subir N CV(s)" → `processesApi.uploadCandidates` — conectado. Drag&drop solo acepta `application/pdf` (más restrictivo que el resto del sitio, que acepta también DOCX/imágenes — inconsistencia menor a alinear).

---

## 6. Detalle de proceso — `hiring-processes/[id]/page.tsx`

| Elemento | Línea aprox. | Estado | Acción esperada |
|---|---|---|---|
| Stepper (tabs Job Description/CVs/Match/Profiling) | 37-89 | Navegación interna de estado | conectado |
| JD — toggle archivo/texto, "Subir archivo JD" | 205-236 | `uploadFileMutation` → `processesApi.uploadJDFile` | conectado |
| JD — "Analizar con IA" | 242-246 | `parseMutation` → `processesApi.parseJD` (stub local, NO IA real) | **mockeado/roto** |
| JD — "Confirmar y guardar JD" | 262-267 | `saveMutation` → `processesApi.saveJD` | conectado |
| JD — Editar/Vista toggle, "+ Agregar" ítem must/nice/dealbreaker | 252-297 | Edición solo en memoria (`structuredJD` local); como `parseJD` es fake, esta sección estructurada nunca refleja una JD real analizada por IA | mockeado (depende de #Analizar con IA) |
| Previsualizar JD (`Eye`) / "Ver/descargar" | 124-139 | Abre `PdfPreviewModal` / link con token | conectado |
| "Subir N CV(s)" (UploadCVsStep) | 376-379 | `processesApi.uploadCandidates` | conectado |
| "Ejecutar Match con IA" | 390-392 | `processesApi.startMatch` | conectado |
| Barra "Consumo IA: $X / Máx $Y" | 528-535 | **Hardcodeado `budget_max_usd * 0.45`** (45% fijo), no viene de `CostLog`/métricas reales | **mockeado** |
| Links "Ranking" / "Vista Kanban" | 405-419, 537-542 | Navegación | conectado |
| ProfilingStep — "Actualizar" (refetch) | 453-455 | `qc.invalidateQueries` sobre `getProfilingRuns` (stub vacío) | sin-implementar (no hay datos reales que refrescar) |
| ProfilingStep — "Ir al Kanban" | 464-466 | Link | conectado |
| "Subir más CVs" (steps Match/Profiling) | 562-564, 576-578 | Abre `UploadCvsModal` (conectado) | conectado |

---

## 7. Kanban de candidatos — `hiring-processes/[id]/candidates/page.tsx`

| Elemento | Línea | Estado | Acción esperada |
|---|---|---|---|
| Carga de columnas HIGH/MEDIUM/LOW | 253-263 | `processesApi.getKanban` con polling adaptativo | conectado |
| Checkbox de selección por card | 103-107, 233 | Estado local `selectedIds` | conectado (ok, es solo UI previa a la acción) |
| Toggle "CV + Profiling / Solo CV / Solo Profiling" | 285-289, 329-343 | Filtra qué barras mostrar en memoria | conectado |
| Botón "Actualizar" (refetch) | 345-347 | `refetch()` | conectado |
| Botón "Iniciar profiling (N)" | 349-354 | `profilingMutation` → `processesApi.startProfiling` (**stub**, no dispara llamadas reales) | **sin-implementar** — debería encolar `ProfilingRun`s y transicionar candidatos a `SELECTED_FOR_PROFILING` |
| Botón "Subir más CVs" | 295-298 | Abre `UploadCvsModal` | conectado |
| "Justificación IA" expand/collapse | 150-157 | Estado local, datos reales del match | conectado |
| No hay drag&drop real entre columnas | — | Las columnas HIGH/MEDIUM/LOW son de solo lectura (la categoría la asigna la IA); no hay handler de drag&drop en absoluto, ni falta — confirma que no es necesario para este Kanban | conectado (por diseño) |

---

## 8. Ranking de candidatos — `hiring-processes/[id]/ranking/page.tsx`

| Elemento | Línea | Estado | Acción esperada |
|---|---|---|---|
| Tabla + filtros (búsqueda, chips Match alto/medio/En llamada/Completado) | 588-620 | Filtra en memoria sobre `processesApi.getCandidatesList` | conectado |
| Checkbox "seleccionar todos" / por fila | 645-649, 670-674 | Estado local | conectado |
| Botón "Activar profiling (N)" | 607-619 | `profilingMutation` → `processesApi.startProfiling` (stub) | **sin-implementar** (mismo problema que Kanban) |
| Botón ver CV normalizado (`FileText`) | 722-730 | Abre `PdfPreviewModal` con URL con token | conectado |
| Botón "Ver análisis completo" (`Sparkles`) → abre `DetailDrawer` | 731-735 | `processesApi.getCandidateDetail` | conectado |
| Expandir breakdown (chevron) | 736-742 | Estado local, datos reales | conectado |
| Drawer — "Ver"/"Bajar" CV original y normalizado | 395-430 | Links con `withToken(...)` a `processesApi.getCvFileUrl`/`getNormalizedCvFileUrl` | conectado |
| **Override del recruiter — "Guardar"** | 505-508 (`OverrideSection.save`, 467-483) | `fetch('/api/v1/processes/.../override')` directo, **URL relativa sin `BASE_URL`**, bypassea `api.ts` | **roto** — probablemente 404 contra el propio Next.js server en vez del backend |
| "Subir más CVs" | 571-574 | Abre `UploadCvsModal` | conectado |

---

## 9. Question Sets — CRUD completo

### Lista — `question-sets/page.tsx`
"Nuevo set" (link), tarjetas clicables a `[id]` — todo conectado a `questionSetsApi.list`.

### Crear — `question-sets/new/page.tsx`
Formulario completo (nombre, descripción, N preguntas con tipo/peso/keywords/critical)
→ `questionSetsApi.create` en submit. "Agregar pregunta"/"Eliminar pregunta" son
estado local antes de guardar. Todo **conectado**.

### Detalle — `question-sets/[id]/page.tsx`
| Elemento | Línea | Estado |
|---|---|---|
| "Activar set" / "Archivar" | 228-238 | `statusMutation` → `questionSetsApi.update` — conectado |
| Editar pregunta (lápiz) → modal | 272-274, 320-322 | `questionSetsApi.updateQuestion` — conectado |
| Eliminar pregunta (basura) | 275-277 | `questionSetsApi.deleteQuestion` — conectado |
| "Nueva pregunta" (botón dashed + modal) | 312-318 | `questionSetsApi.addQuestion` — conectado |

**Question Sets es el módulo más completamente conectado de todo el frontend.**

---

## 10. Profiling — `src/app/(dashboard)/profiling/page.tsx`

Página **100% estática**: los 4 StatCard ("Llamadas activas 0/4", "En cola 0",
"Completadas 0", "Tasa contacto —") son valores **hardcodeados en el JSX**, no
hay ningún `useQuery` ni llamada a `api.ts` en todo el archivo. No hay botones
de acción. **sin-implementar** en su totalidad — es un placeholder visual.

---

## 11. Métricas — `src/app/(dashboard)/metrics/page.tsx`

Usa `useQuery` + `metricsApi.getDashboard()` correctamente (conectado en el
sentido de arquitectura), pero la función subyacente es un stub que siempre
devuelve `total_cost_usd: 0` y arrays vacíos → todos los KPIs, el line chart de
consumo diario, el bar chart por operación y el ranking de "Top procesos" están
permanentemente vacíos. **mockeado** — falta implementar `getDashboard` contra
un endpoint real de costos/`CostLog` en el backend.

---

## 12. Settings — `src/app/(dashboard)/settings/page.tsx`

Página **100% estática**, no importa `settingsApi` en absoluto:

| Elemento | Línea | Estado | Acción esperada |
|---|---|---|---|
| Tabs Usuarios/Parámetros de IA/Integraciones | 24-41 | Solo cambia estado local | conectado (navegación ok) |
| Tab "Usuarios" | 43-53 | Mensaje "disponible cuando el backend implemente..." | sin-implementar (reconocido explícitamente en la UI) |
| Select "Modelo activo" | 61-69 | Un solo `<option>` fijo, sin `onChange`, sin guardar | **sin-implementar** |
| Select "Prompt de match" | 70-80 | Igual, sin `onChange` | **sin-implementar** |
| Inputs "Umbral Match alto/medio/bajo" | 81-92 | `defaultValue` fijo (80/60/40), sin `onChange`, sin botón guardar | **sin-implementar** |
| Tarjetas de integración (n8n, Vapi) con API key enmascarada | 105-133 | Datos **hardcodeados** en el array del componente (no existen en backend real) | **mockeado** |
| Botón "Probar conexión" | 127-129 | **Sin `onClick`** | **sin-implementar** |

---

## 13. Componentes compartidos

- `Header.tsx`: buscador global (`<input placeholder="Buscar...">`, línea ~49-53) sin `onChange`/`value` — decorativo, **sin-implementar**. Botón de campana de notificaciones (línea ~57-60) sin `onClick` — **sin-implementar**.
- `FloatingNav.tsx`: navegación + mover posición (persistida en `localStorage` vía `NavbarPositionContext`) + "Cerrar sesión" (`logout()` + redirect) — todo **conectado**.
- `UploadCvsModal.tsx`: drag&drop + `processesApi.uploadCandidates` + invalidación de queries — **conectado**, es el patrón de referencia correcto.
- `PdfPreviewModal.tsx`: visor iframe + descarga + abrir en pestaña — **conectado** (dependiente de que la URL ya traiga el token).

---

## 14. Checklist priorizado de conexión

### P0 — Bloqueantes / bugs activos
1. **Arreglar `OverrideSection.save` en `ranking/page.tsx`** (línea ~467): reemplazar el `fetch` relativo roto por una función nueva en `api.ts` (p. ej. `candidatesApi.updateOverride(processId, pcId, {human_notes, human_override_match})`) que use el cliente axios con `BASE_URL` y el interceptor de auth. Eliminar o reimplementar los stubs muertos `candidatesApi.updateNotes/updateStatus`.
2. **Decidir si "Analizar con IA" (JD) debe existir**: hoy promete análisis IA y solo trunca texto. O se oculta ese botón hasta que el backend tenga endpoint de parseo de JD, o se conecta a uno real.

### P1 — Core del negocio (login, kanban, procesos)
3. **Login**: conectar "Enviar enlace de recuperación" a un endpoint real de recuperación de contraseña (o quitar el flujo si no habrá backend para esto).
4. **Profiling — disparo de llamadas de voz**: implementar `processesApi.startProfiling` contra un endpoint real (hoy no existe en el backend, según el propio comentario en `api.ts`). Esto afecta 2 botones (Kanban "Iniciar profiling", Ranking "Activar profiling") y bloquea todo el módulo de Profiling.
5. **`getProfilingRuns`**: conectar a un endpoint real de estado de `ProfilingRun` para que `ProfilingStep` en `[id]/page.tsx` y la página `/profiling` dejen de estar vacíos.
6. **Botón "···" en listado de procesos**: implementar menú (archivar/duplicar/eliminar) o quitarlo si no hay acción prevista.

### P2 — Question Sets
7. Ya está conectado en su totalidad — solo verificar que los endpoints reales del backend coincidan en shape con lo que `api.ts` espera (revisar contrato).

### P3 — Métricas y Settings
8. **Métricas**: conectar `metricsApi.getDashboard` a un endpoint real de `CostLog` (agregado por día/operación/proceso).
9. **Settings**: decidir alcance real — hoy es 100% maqueta. Si se va a construir, empezar por "Umbrales de match" (bajo, medio, alto) ya que afectan directamente la categorización visible en Kanban/Ranking; dejar "Usuarios" e "Integraciones" para después.
10. **Barra de "Consumo IA" en `[id]/page.tsx`**: reemplazar el 45% hardcodeado por datos reales de costo por proceso (depende del mismo trabajo de métricas).

### P4 — Pulido / decorativos
11. Buscador y campana en `Header.tsx`: implementar o quitar (hoy son ruido visual sin función).
12. Unificar extensiones de archivo aceptadas en el paso 3 del wizard de creación (`new/page.tsx`, solo PDF) con el resto del sitio (PDF/DOCX/imágenes).

---

## Resumen de dead code detectado

- `src/lib/mockData.ts` (1137 líneas) — no se importa desde ningún lugar.
- `NEXT_PUBLIC_USE_MOCK` — no se lee en ningún archivo de `src/`.
- `candidatesApi.updateNotes` / `candidatesApi.updateStatus` — nunca se llaman (el override real usa un `fetch` suelto en su lugar).
- `settingsApi.*` (6 funciones) — nunca se llaman desde `settings/page.tsx`.
