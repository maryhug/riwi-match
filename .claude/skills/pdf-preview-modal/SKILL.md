---
name: pdf-preview-modal
description: Úsala en riwi-match al mostrar un visor de PDF/documento en un modal con <iframe> (preview de CV, JD). Modelo de referencia PdfPreviewModal.tsx. Documenta el patrón (spinner con reset por fileUrl, scroll-lock, abrir/descargar) y sus caveats (sin manejo de error de carga, descarga cross-origin, scroll-lock global).
---

# Modal de preview de PDF (riwi-match)

Modelo de referencia: `src/components/ui/PdfPreviewModal.tsx`. Visor de documentos vía
`<iframe>` dentro de un overlay.

## Estructura del patrón

1. **Spinner con reset por cambio de documento**:
   ```ts
   const [loading, setLoading] = useState(true);
   useEffect(() => { setLoading(true); }, [fileUrl]);   // reinicia al cambiar de archivo
   ```
   Necesario porque en pantallas como `ranking` el modal está **siempre montado** y solo cambia
   `fileUrl` (a `''` al cerrar, a la URL nueva al abrir).
2. **`<iframe>`** con la URL autenticada (`?token=<jwt>`, ver skill `authenticated-file-url`) y
   `onLoad={() => setLoading(false)}`.
3. **Acciones**: abrir en pestaña nueva y descargar (`<a download>`).
4. **Scroll-lock** del body mientras `isOpen`, con cleanup en el `return` del effect.

## Caveats (endurecer al estandarizar)

- ⚠️ **`onLoad` también dispara en carga fallida**: si el 302 a R2 falla o el token es
  inválido, el `<iframe>` termina de "cargar" contenido roto, el spinner desaparece y no hay
  estado de error. Añade manejo de error (evento del iframe o un timeout) y una vista de
  fallback.
- ⚠️ **`<a download>` no fuerza descarga cross-origin**: como el backend responde 302 a un
  dominio de R2 distinto, el navegador **ignora** el atributo `download` y abre el archivo en
  vez de descargarlo. Si necesitas descarga real, resuélvelo en backend (header
  `Content-Disposition: attachment` en la URL prefirmada) o descargando el blob vía fetch
  autenticado y `URL.createObjectURL` (recordando revocar el object URL).
- ⚠️ **Scroll-lock global sin ref-count**: muta `document.body.style.overflow` directamente;
  si convive con otro overlay (p. ej. `UploadCvsModal`), cerrar uno desbloquea el fondo con el
  otro abierto. Prefiere un `useScrollLock()` compartido con contador (ver skill
  `upload-files-modal`, nota transversal).
- El token en la URL del `<iframe>` queda visible en el DOM (caveat de seguridad de
  `authenticated-file-url`).

## Verificación

- Abrir el modal muestra el documento; reabrir con otro `fileUrl` reinicia el spinner.
- Una URL inválida/expirada no deja el spinner colgado ni muestra contenido roto sin aviso
  (una vez añadido el manejo de error).
- Al cerrar, el scroll del fondo se restaura (coordinado si hay otros overlays).
