# Plan: elegir entre FloatingNav y Sidebar desde Ajustes

> **Estado:** plan aprobado, **pendiente de implementar**.
> **Rama:** `feature/connection`.
> **Decisiones tomadas:**
> - Usar la `Sidebar.tsx` **huérfana de esta rama** como base (NO la de `main`, que es más
>   antigua: `RAIL_W`, colores hardcodeados, imports muertos, items `/profiling` y "Dashboard
>   de Equipo"). La huérfana ya usa rutas, CSS vars y gating por rol correctos de esta rama.
> - Extender `NavbarPositionContext` para la preferencia de estilo (no crear contexto nuevo).

---

## 1. Estado actual (verificado)

**FloatingNav** (`src/components/layout/FloatingNav.tsx`)
- Pill flotante `position: fixed`, reposicionable en 4 posiciones (`left`/`right`/`top`/`bottom`).
- Lee `useNavbarPosition()` (posición) y `useAuth()` (`role`/`logout`).
- `NAV_ITEMS`: Procesos (`/hiring-processes`), Preguntas (`/question-sets`), Nuevo
  (`/hiring-processes/new`), Dashboard (`/dashboard`), Costos (`/metrics`). El item
  `/settings` se añade solo si `role === 'ADMIN'`.
- Exporta helper `useNavOffset()` (no lo usa nadie hoy; el layout calcula el padding inline).

**Sidebar** (`src/components/layout/Sidebar.tsx`) — huérfano en esta rama, nadie lo importa
- Rail vertical fijo a la izquierda (`left:16, top:16, bottom:16, width:72`) con animación
  `motion`. `motion@^12.41.0` está en `package.json` y en `node_modules` → renderiza sin problema.
- Usa CSS vars `--color-rail`, `--color-canvas`, `--color-rail-active`, `--color-rail-muted`,
  definidas en `src/app/globals.css` (líneas 42-46).
- `NAV_ITEMS`: Procesos, Sets de Preguntas, Dashboard, Costos + item "Nuevo" como Link aparte
  + `/settings` gateado por `role === 'ADMIN'`.
- Exporta `V_W=72`, `H_H=76`, `GAP=16`.

**Layout** (`src/app/(dashboard)/layout.tsx`)
- `DashboardLayout` envuelve todo en `<NavbarPositionProvider>` y renderiza `<DashboardContent>`.
- `DashboardContent` monta `<FloatingNav />` y calcula `pad` inline según `position`
  (left→pL 100, right→pR 100, top→pT 84, bottom→pB 84; resto 32/28).

**Persistencia de preferencias hoy**
- Patrón único: Context + `localStorage`, con guarda SSR. El estado inicializa a un default
  fijo (`'left'`) y un `useEffect` lee `localStorage` tras montar
  (`NavbarPositionContext.tsx` líneas 18-25). `setPosition` escribe a
  `localStorage.setItem('navbar_position', ...)`. `AuthContext` sigue el mismo patrón
  (`access_token`, `user_role`). Evita mismatch de hidratación porque el primer render siempre
  coincide con el server (default).

---

## 2. Diseño propuesto: preferencia "estilo de navegación"

**Modelo:** `type NavStyle = 'floating' | 'sidebar'`, default `'floating'` (comportamiento actual).

**Dónde vive el estado — EXTENDER `NavbarPositionContext`** (sin renombrar archivo/provider,
para minimizar tocar imports):
- El layout ya envuelve en `NavbarPositionProvider` y consume `useNavbarPosition()`. Añadir
  `style`/`setStyle` ahí es la vía de menor fricción y mantiene la preferencia de nav en un
  solo sitio.
- Alternativa (descartada por wiring innecesario): `src/contexts/NavPreferenceContext.tsx`
  separado con otro provider anidado.

**Cambios en `NavbarPositionContext.tsx`:**
- Añadir `style: NavStyle` y `setStyle(s: NavStyle)` al value/interface.
- `useState<NavStyle>('floating')` como default.
- En el `useEffect` existente, leer también `localStorage.getItem('nav_style')` y validar
  contra `['floating','sidebar']` antes de setear (mismo patrón defensivo que `position`).
- `setStyle` escribe `localStorage.setItem('nav_style', s)` (idealmente con try/catch).

**SSR/hidratación:** se mantiene el patrón existente (default en primer render, lectura en
`useEffect`). Con `nav_style='sidebar'` guardado habrá un flash breve FloatingNav → Sidebar tras
hidratar (igual que hoy con `position`). Mitigable opcionalmente con un flag `hydrated` que
retrase el render de la nav.

**Render condicional en el layout:**
- `DashboardContent` consume `const { position, style } = useNavbarPosition();`.
- Nav: `{style === 'sidebar' ? <Sidebar /> : <FloatingNav />}`. **Solo una montada a la vez**.
- Offset/padding condicional por estilo:
  - `sidebar` → `{ paddingLeft: 100, paddingRight: 32, paddingTop: 28, paddingBottom: 28 }`.
  - `floating` → el `pad` actual basado en `position`.
  - Mantener `transition-all duration-300` para animar el cambio.

---

## 3. Reconciliación de la Sidebar

- **Usar la Sidebar huérfana de `feature/connection` tal cual** (no la de `main`). Ya está
  limpia, con rutas/CSS vars correctas y gating `/settings` por `role === 'ADMIN'`.
- **Sin conflicto de rutas nuevas**: no hay item de nav `/ranking` (es subpágina, no destino
  de nav). `/profiling` solo aparece en la de `main` (otra razón para no traerla).
- **Diferencias menores cosméticas** (no bloquean): etiquetas ("Preguntas" vs "Sets de
  Preguntas"); "Nuevo" es `NAV_ITEMS` en FloatingNav y Link hardcodeado en Sidebar; gating
  ADMIN idéntico en ambas.
- **Acción sobre el archivo:** cero cambios — basta re-importarlo desde el layout. (Opcional:
  unificar `NAV_ITEMS` de ambas navs en un módulo compartido, refactor aparte.)

---

## 4. UI en Ajustes

`src/app/(dashboard)/settings/page.tsx` (client component, ya usa `useState`).
- **Control segmentado** "Estilo de navegación": "Flotante" | "Barra lateral".
- **Ubicación:** una `Card` nueva tras el `<Header>` y antes de las Tabs (visible sin depender
  de la tab activa).
- **Wiring:** `const { style, setStyle } = useNavbarPosition();` + dos botones que llaman
  `setStyle(...)`, resaltando el activo (patrón violet-600 activo / slate inactivo).
- **Feedback:** cambio en caliente (context → re-render del layout → swap de nav). Sin botón
  "Guardar".

---

## 5. Archivos a crear/editar (en orden)

1. **`src/contexts/NavbarPositionContext.tsx`** (EDITAR) — añadir `style`/`setStyle`, default
   `'floating'`, lectura+validación de `localStorage['nav_style']` en el `useEffect`,
   persistencia en `setStyle`. Base sin la cual no hay estado que consumir.
2. **`src/app/(dashboard)/layout.tsx`** (EDITAR) — importar `Sidebar`, consumir `style`, render
   condicional + ramificar el cálculo de `pad`.
3. **`src/app/(dashboard)/settings/page.tsx`** (EDITAR) — control segmentado que lee/escribe `style`.
4. **`src/components/layout/Sidebar.tsx`** (SIN cambios / verificar) — se reactiva al importarlo.

No se crean archivos nuevos si se extiende el context existente (ruta recomendada).

---

## 6. Riesgos y edge cases

- **Flash de hidratación** con `nav_style='sidebar'` guardado (mismo que `position` hoy).
  Mitigable con flag `hydrated`.
- **Solo una nav montada**: el ternario evita dobles `fixed`/listeners/z-index en conflicto.
- **Offset al alternar**: si se olvida ramificar `pad`, en modo Sidebar el contenido queda
  tapado por el rail. Mantener `transition-all`.
- **Item ADMIN-only**: ambas navs gatean `/settings` igual → consistente.
- **Acceso al toggle solo para ADMIN**: `/settings` no está gateada a nivel de página, pero el
  **link** de nav solo aparece para ADMIN. Un no-admin no llega a Ajustes por la nav y no
  podría cambiar el estilo (preferencia de UI personal). **Decisión pendiente:** si se quiere
  para todos, exponer el toggle en otro punto o el item de settings a todos.
- **Persistencia corrupta**: validar el valor leído contra `['floating','sidebar']`.
- **`position` irrelevante en modo sidebar**: el popover "Mover a" solo existe en FloatingNav;
  al volver a floating se conserva la última `position`.
- **Dependencia `motion`**: confirmada presente; si se limpian dependencias, Sidebar dejaría
  de compilar.

---

## 7. Verificación

1. `npm run build` / `tsc` — Sidebar re-integrado y context extendido tipan sin errores.
2. Como ADMIN: en `/settings`, alternar el segmentado → la nav cambia en caliente; el
   contenido no queda tapado en ningún modo.
3. Recargar con cada estilo → persiste (`localStorage.nav_style`); observar flash aceptable.
4. En floating, mover la pill y confirmar padding por `position`; en sidebar, padding izquierdo fijo.
5. Como NO ADMIN: confirmar que ninguna nav muestra `/settings` (y anotar la limitación de acceso).
6. Navegar todas las rutas en modo sidebar → el círculo activo se posiciona vía `getActiveId`.
7. `localStorage.nav_style = 'basura'` + recargar → cae a `'floating'` sin romper.

---

### Archivos críticos
- `src/contexts/NavbarPositionContext.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/FloatingNav.tsx`
