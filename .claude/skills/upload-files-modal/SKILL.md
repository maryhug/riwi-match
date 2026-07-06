---
name: upload-files-modal
description: Úsala en riwi-match al crear un modal de subida de archivos (CVs, JD) con drag&drop multi-archivo, validación de extensión, useMutation e invalidación de queries. Modelo de referencia UploadCvsModal.tsx. Documenta el patrón correcto y sus caveats (validación de tamaño ausente, scroll-lock global, semántica todo-o-nada).
---

# Modal de subida de archivos (riwi-match)

Modelo de referencia: `src/components/ui/UploadCvsModal.tsx`. Patrón para "seleccionar N
archivos y refrescar las tablas afectadas".

## Estructura del patrón

1. **Estado local** con `File[]` (no object URLs — solo se muestra `f.name`).
2. **Filtro de extensiones** antes de aceptar un archivo:
   ```ts
   const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp'];
   const isAllowed = (f: File) => ALLOWED_EXTS.some((ext) => f.name.toLowerCase().endsWith(ext));
   ```
   Mantén **alineados** la lista, el mensaje de error y el rótulo de ayuda (hoy divergen: el
   rótulo dice "PDF, DOCX, JPG, PNG, WEBP" pero `ALLOWED_EXTS` también acepta `.tiff/.bmp`).
3. **Mutación** con `useMutation` que llama al endpoint multipart de `api.ts`
   (`processesApi.uploadCandidates` / `uploadJDFile`). Ver skill `add-api-endpoint-with-query`.
4. **Invalidación completa** en `onSuccess` — invalida TODAS las vistas que muestran esos
   datos, no solo una:
   ```ts
   qc.invalidateQueries({ queryKey: ['process', processId] });
   qc.invalidateQueries({ queryKey: ['candidates', processId] });
   qc.invalidateQueries({ queryKey: ['kanban', processId] });
   ```
5. **Estados de UI**: `isPending` (spinner), `error` desde `response.data.detail`, y una
   pantalla de éxito con el conteo subido que se resetea al cerrar.

## Caveats (endurecer al estandarizar)

- ⚠️ **No hay validación de tamaño en cliente**, aunque el rótulo diga "máx. 10 MB por
  archivo". El rechazo por tamaño solo ocurre en el backend (JD 10 MB en `processes.py`; CVs
  `_MAX_FILE_MB=10` + `_ALLOWED_EXTENSIONS` + `cv_batch_limit` en `application/cv/use_cases.py`).
  Añade una comprobación de `f.size` en cliente para feedback inmediato.
- ⚠️ **Fallo parcial NO atómico**: el backend recorre los archivos, sube cada uno a R2 y crea
  registro; si el archivo N falla validación lanza `BusinessRuleException` (400) y la DB hace
  rollback, pero **los archivos 1..N-1 ya subidos a R2 quedan huérfanos**. El front recibe un
  400 con `detail` pero no hay reporte de éxito parcial: es todo-o-nada de cara al usuario.
- ⚠️ **Scroll-lock global sin ref-count**: el modal muta `document.body.style.overflow`
  directamente. Si conviven dos modales (p. ej. este y `PdfPreviewModal` en `ranking`),
  cerrar uno restaura el scroll con el otro aún abierto. Prefiere un hook `useScrollLock` con
  contador compartido (ver "Nota transversal" abajo).

## Nota transversal — `useScrollLock`

Varios componentes (`UploadCvsModal`, `PdfPreviewModal`, el `DetailDrawer` de `ranking`)
mutan `document.body.style.overflow` sin coordinación. Antes de replicar el patrón, considera
extraer un único `useScrollLock()` con ref-count para que el fondo solo se desbloquee cuando
**todos** los overlays estén cerrados.

## Verificación

- Subir archivos válidos refresca las 3 vistas (`process`/`candidates`/`kanban`).
- Un archivo con extensión no permitida se rechaza en cliente con mensaje claro.
- Al cerrar el modal, el scroll del fondo se restaura (y no antes, si hay otro overlay abierto).
- `npm run lint` sin errores nuevos.
