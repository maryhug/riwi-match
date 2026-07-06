---
name: floating-repositionable-nav
description: Úsala en riwi-match al trabajar con la navbar flotante reposicionable (FloatingNav) o su preferencia de posición persistida (NavbarPositionContext). Documenta el patrón navbar + contexto + persistencia en localStorage + gating por rol, y sus caveats (offset duplicado, write a localStorage sin try/catch, gating solo-UI, salto de hidratación).
---

# Navbar flotante reposicionable (riwi-match)

Componentes: `src/components/layout/FloatingNav.tsx` (la pill flotante) y
`src/contexts/NavbarPositionContext.tsx` (preferencia de posición). Se monta en
`src/app/(dashboard)/layout.tsx` dentro de `NavbarPositionProvider`.

## Estructura del patrón

- **Contexto de preferencia** persistida en `localStorage` con guarda de hidratación:
  ```ts
  const [position, setPositionState] = useState<NavPosition>('left');      // default fijo (server + primer render cliente)
  useEffect(() => {                                                        // lee tras montar
    const saved = localStorage.getItem('navbar_position') as NavPosition | null;
    if (saved && ['left', 'right', 'top', 'bottom'].includes(saved)) setPositionState(saved);
  }, []);
  const setPosition = (pos: NavPosition) => { setPositionState(pos); localStorage.setItem('navbar_position', pos); };
  ```
  El **whitelist** (`['left','right','top','bottom']`) protege contra un `localStorage`
  corrupto: un valor inválido cae al default sin romper.
- **Navegación**: `NAV_ITEMS` en `FloatingNav.tsx`. El item `/settings` (Config) se añade solo
  si `role === 'ADMIN'` (vía `useAuth()`). El activo se calcula con `getActiveId(pathname)`.
- **Offset del layout**: el `<main>` de `(dashboard)/layout.tsx` ajusta su padding según
  `position`.

## Caveats (endurecer al estandarizar)

- ⚠️ **Offset duplicado y divergente**: `FloatingNav.tsx` exporta `useNavOffset` (valores
  88/72) pero **el layout no lo usa** — calcula su propio padding inline con otros números
  (100/32/84/28). `useNavOffset` es **código muerto** y hay dos fuentes de verdad con magic
  numbers distintos. Al tocar esto, unifica: que el layout consuma `useNavOffset` (o elimínalo)
  y define los números en un solo sitio.
- ⚠️ **`setPosition` escribe a `localStorage` sin try/catch**: en Safari privado o con cuota
  llena lanza excepción no manejada. Envuelve el `setItem` en try/catch.
- **Gating por rol es solo-UI, no seguridad**: ocultar `/settings` para no-ADMIN es UX; la
  barrera real la aplica el backend (`require_role`). Nunca dependas de esto para autorizar.
  Durante la carga `role` puede ser `null` (el avatar cae a `'U'`) — está manejado.
- **Salto de hidratación**: server y primer render pintan la posición default (`'left'`); tras
  montar, el `useEffect` aplica la guardada. No hay *mismatch* de hidratación, pero sí un salto
  visual si el usuario guardó otra posición. Aceptable; si molesta, añade un flag `hydrated` y
  no pintes la navbar hasta `hydrated === true`.
- **Popover "mover"** sin cierre por click-fuera (solo cierra al togglear el avatar o elegir
  opción): detalle de UX a mejorar.

## Relación con el toggle de estilo de navegación

Si se implementa la preferencia "estilo de navegación" (FloatingNav vs Sidebar) con opción en
Ajustes, el estado vive extendiendo este `NavbarPositionContext` (`style: 'floating' |
'sidebar'`), persistido con el mismo patrón defensivo (whitelist + guarda de hidratación). El
`position` solo aplica en modo `floating`.

## Verificación

- Mover la pill entre las 4 posiciones actualiza el padding del layout y persiste al recargar.
- Un `localStorage.navbar_position` manipulado a un valor inválido cae al default sin romper.
- El item Config solo aparece para ADMIN.
