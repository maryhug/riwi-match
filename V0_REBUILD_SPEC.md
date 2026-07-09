# RIWI MATCH — Playbook de reconstrucción visual para v0.dev

> **Este documento es autocontenido.** v0 no tiene acceso a este repositorio: nunca vas a adjuntarle
> código fuente por separado. Todo lo que v0 necesita para generar cada pieza — interfaces
> TypeScript, datos reales, comportamiento exacto, valores de color — está escrito literalmente
> aquí abajo. Cuando una sección diga "pega el Bloque Común", es una referencia **dentro de este
> mismo documento** (para no repetir 300 líneas 14 veces), no una referencia a un archivo del repo.

## 0. Cómo usar este documento

1. Empieza por la **Parte 1** y la **Parte 2** en un chat de v0 (puedes pegarlas juntas o por
   separado) para que v0 fije el sistema de diseño y los componentes compartidos antes de tocar
   páginas.
2. Para cada página de la **Parte 3**, copia y pega la subsección completa (incluye su propio
   "Prompt v0 listo para copiar") en un chat nuevo de v0. Cada una ya trae pegado el **Bloque
   Común** (design tokens + FloatingNav + Header) para que la navegación se vea igual en todas
   las pantallas sin que v0 tenga que "recordar" nada de un chat anterior.
3. Dile siempre a v0, explícitamente, que **no invente campos de datos** que no estén en el bloque
   de tipos de esa sección — todos los tipos aquí son reales, tomados de
   `src/lib/types.ts` del proyecto.
4. Sigue el orden de la **Parte 4** — cada página reutiliza patrones ya validados por la anterior.
5. RIWI MATCH es una plataforma de matching de CVs con IA para procesos de contratación (backend
   FastAPI + Celery, frontend Next.js 16 App Router). Dile esto a v0 como contexto de producto al
   principio de cualquier prompt.

---

## 1. Sistema de diseño global

### 1.1 Filosofía

Nada de fondos blancos/gris-frío dominantes, y **cero degradados** (`linear-gradient`,
`radial-gradient`) en ningún lugar de la interfaz — ni en botones, ni en heros, ni en avatares.
En su lugar: base cálida tipo marfil (no blanco puro), rellenos **sólidos y saturados** para dar
color, chips circulares de color para iconos, bordes/sombras con tinte de color para dar
profundidad. El resultado debe sentirse moderno, fresco y accesible — no genérico, no un dashboard
gris con acentos violeta y ya.

### 1.2 Paleta — modo claro (light, default)

```
--color-bg:              #F5F0E6   /* fondo general de la app: marfil cálido, NO blanco ni slate */
--color-bg-subtle:       #ECE3D2   /* relleno de secciones/franjas de stats, un tono más oscuro que bg */
--color-surface:         #FFFCF6   /* fondo de cards/tablas: blanco roto cálido, NO #FFFFFF puro */
--color-surface-raised:  #FFFFFF   /* SOLO modales, popovers, dropdowns — lo único que usa blanco puro */
--color-border:          #E3D9C4
--color-border-strong:   #CFC0A0
--color-ink:             #1C1712   /* texto de máximo contraste: títulos */
--color-text:            #5B5445   /* texto de cuerpo */
--color-text-muted:      #8B8271   /* texto secundario / meta */

--color-primary:         #7C3AED   /* violeta — acción primaria */
--color-primary-dark:    #5B21B6
--color-primary-light:   #EDE9FE
--color-primary-xlight:  #F5F3FF

--color-mint:            #059669   /* esmeralda — éxito / completado */
--color-mint-dark:       #047857   /* usar esta variante para texto BLANCO sobre relleno sólido */
--color-mint-light:      #D1FAE5

--color-accent:          #D97706   /* ámbar — en progreso / atención */
--color-accent-dark:     #B45309   /* usar esta variante para texto BLANCO sobre relleno sólido */
--color-accent-light:    #FEF3C7

--color-coral:           #DC2626   /* rojo — error / crítico / cerrar sesión */
--color-coral-dark:      #B91C1C
--color-coral-light:     #FEE2E2

--color-blue:            #2563EB   /* azul — informativo */
--color-blue-light:      #DBEAFE

--color-pink:            #DB2777   /* rosa/fucsia — costos/métricas (ya se usaba en la navbar) */
--color-pink-light:      #FCE7F3
```

**Regla de contraste obligatoria:** nunca pongas texto blanco directamente sobre `--color-mint` o
`--color-accent` base — no cumplen 4.5:1 de contraste. Para un botón o badge de relleno sólido con
texto blanco usa siempre `--color-mint-dark` o `--color-accent-dark`. El resto de la paleta base
(`primary`, `coral`, `blue`, `pink`) sí cumple AA con texto blanco encima.

### 1.3 Paleta — modo oscuro (dark)

Violeta-carbón, no negro puro ni gris genérico — para que el dark mode se sienta parte de la misma
marca, no un tema "bolteado" encima.

```
--color-bg:              #14121B
--color-bg-subtle:       #1C1926
--color-surface:         #201C2C
--color-surface-raised:  #262233
--color-border:          #332D45
--color-border-strong:   #453D5C
--color-ink:              #F5F3FA
--color-text:             #C7C2D6
--color-text-muted:       #8B84A3

/* Para TEXTO/ÍCONO sobre fondo oscuro (no para relleno de botón), usar estas variantes claras: */
--color-primary (on-dark):  #A78BFA
--color-mint (on-dark):     #34D399
--color-accent (on-dark):   #FBBF24
--color-coral (on-dark):    #F87171
--color-blue (on-dark):     #60A5FA
--color-pink (on-dark):     #F472B6
```

Los botones/badges de **relleno sólido con texto blanco** en modo oscuro siguen usando los mismos
hex base que en modo claro (`#7C3AED`, `#047857`, `#B45309`, `#DC2626`, `#2563EB`, `#DB2777`) — solo
el texto/ícono suelto sobre el fondo usa las variantes claras de arriba.

### 1.4 Cómo implementar el modo oscuro (Tailwind CSS 4, config CSS-first, sin `tailwind.config.js`)

Dale a v0 estas instrucciones técnicas exactas:

1. En el CSS global, justo después de `@import "tailwindcss";`, agregar:
   ```css
   @custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
   ```
2. Definir los tokens de la Parte 1.2 (modo claro) dentro de un bloque `@theme { ... }` — eso es lo
   que genera las clases utilitarias (`bg-bg`, `text-ink`, `border-border`, `bg-primary`, etc.).
3. Fuera del bloque `@theme`, agregar un selector CSS normal que reasigna las mismas variables bajo
   `[data-theme="dark"]`:
   ```css
   [data-theme="dark"] {
     --color-bg: #14121B;
     --color-surface: #201C2C;
     --color-ink: #F5F3FA;
     /* ...el resto de tokens de la Parte 1.3... */
   }
   ```
   Como todas las utilidades de color resuelven a `var(--color-*)`, este único bloque propaga el
   modo oscuro a **toda la interfaz sin necesidad de escribir `dark:` en cada componente**.
4. **Regla de oro para cualquier componente:** usar solo clases de token semántico (`bg-bg`,
   `bg-surface`, `bg-surface-raised`, `text-ink`, `text-text`, `text-text-muted`, `border-border`,
   `bg-primary`, `text-primary`, etc.). Nunca usar clases de color literal de Tailwind
   (`bg-white`, `bg-slate-50`, `text-slate-900`, `border-slate-200`) — esas no cambian con el tema.
5. Toggle de tema: un contexto de React simple con dos estados `'light' | 'dark'`. Al montar, lee
   `localStorage.getItem('theme')` dentro de un `useEffect` (con `try/catch` alrededor de la
   lectura Y la escritura — no asumas que `localStorage` siempre está disponible). Si no hay valor
   guardado, usa `window.matchMedia('(prefers-color-scheme: dark)').matches` como default. Al
   cambiar de tema: `document.documentElement.dataset.theme = theme` y
   `localStorage.setItem('theme', theme)` (protegido con `try/catch`).
6. Para evitar un parpadeo del tema incorrecto al cargar, agrega un `<script>` inline (no un
   archivo externo) al principio del `<head>`, antes de cualquier CSS, que lea `localStorage.theme`
   síncronamente y setee `data-theme` en `<html>` antes de que se pinte la página.
7. Un botón `ThemeToggle` (ícono sol/luna) alterna entre los dos estados. Debe llevar
   `aria-label="Cambiar tema"`.

### 1.5 Tipografía

Dos familias tipográficas (ya configuradas en el proyecto real, mantenlas): **Montserrat
Alternates** para títulos/display (pesos 400 a 800) y **Plus Jakarta Sans** para texto de cuerpo
(pesos 400 a 700). Tamaño base de cuerpo: **13px** (es un producto denso en datos, no ampliar el
base). Escala:

| Uso | Familia / peso | Tamaño |
|---|---|---|
| Hero / título de página grande (login) | display, 800 | 30–36px |
| Título de página (`Header`) | display, 700 | 20px |
| Título de sección / card | display, 600 | 16px |
| Énfasis de cuerpo | body, 600 | 14px |
| Cuerpo default | body, 400/500 | 13px |
| Texto secundario / meta | body, 400 | 12px |
| Micro-label (badges, headers de tabla, timestamps) | body, 600, uppercase, tracking amplio | 11px |

### 1.6 Espaciado y radios (nuevo — no hay uno definido hoy, créalo así)

```
--radius-xs:   6px    /* chips diminutos */
--radius-sm:   10px   /* inputs, botones chicos */
--radius-md:   14px   /* radio "de casa": cards y botones default */
--radius-lg:   20px   /* modales, paneles grandes */
--radius-xl:   28px   /* bloques hero */
--radius-full: 999px  /* pills, avatares, la navbar flotante */
```

Padding estándar de card: `20px` (`p-5` en Tailwind). Separación vertical entre bloques grandes de
una página: `40px` (`space-y-10`). Gutter de grillas: `24px` (`gap-6`).

### 1.7 Accesibilidad — reglas concretas, no opcionales

- Contraste de texto ≥ 4.5:1 para texto normal, ≥ 3:1 para texto grande (≥18px o ≥24px en negrita)
  y para bordes/estados con significado (inputs, foco).
- **Todo elemento interactivo tiene un estado de foco visible**: anillo de 2px con offset,
  usando el color de marca en su tono **base** saturado (no el tono `-light` pálido) —
  `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary` como patrón.
- Target táctil mínimo **40×40px** en cualquier botón que solo tenga ícono (campana, cerrar, menú
  kebab).
- Todo botón solo-ícono lleva `aria-label` descriptivo (ej: `aria-label="Notificaciones"`,
  `aria-label="Cambiar tema"`, `aria-label="Mover navegación"`, `aria-label="Acciones"`).
- Respeta `prefers-reduced-motion` en las transiciones de la navbar flotante y del cambio de tema.

### 1.8 Regla "sin degradados" — qué usar en su lugar

Está **prohibido** usar `linear-gradient`/`radial-gradient` en cualquier parte de la interfaz.
En su lugar, para dar sensación de color/profundidad:

- **Relleno sólido saturado** (los hex de la Parte 1.2/1.3) en CTAs, badges, chips de ícono.
- **Borde de acento lateral o superior** (`border-left: 4px solid var(--color-primary)`) en cards
  o paneles que necesiten destacar.
- **Chips circulares de color sólido** para íconos de tarjetas de estadística o filas de lista:
  círculo de ~32-36px con fondo en el tono `-light` de un color de marca y el ícono en el tono
  base de ese mismo color (ej: fondo `#EDE9FE` + ícono `#7C3AED`). Este patrón — no un degradado —
  es el que reemplaza cualquier badge/ícono "llamativo".
- **Sombras con tinte de color** en vez de negro puro para dar elevación:
  `box-shadow: 0 4px 24px rgba(124,58,237,0.10), 0 1px 4px rgba(0,0,0,0.05)` (tinte violeta) en vez
  de una sombra gris genérica.
- **Bloques de color plano** (`background: var(--color-bg-subtle)`) para secciones que necesiten
  distinguirse del fondo general, en vez de un hero con degradado.

---

## 2. Componentes compartidos

> Estos son los componentes que se reutilizan en múltiples páginas. Cada uno trae su interfaz
> TypeScript real y su comportamiento exacto — v0 debe reproducir esta API tal cual, solo
> rediseñando la parte visual.

### 2.1 Bloque Común (design tokens + navegación) — pega esto al inicio de CUALQUIER prompt de página del dashboard

```
CONTEXTO DE PRODUCTO: RIWI MATCH, plataforma de matching de CVs con IA para procesos de
contratación (Next.js 16 App Router, TypeScript, Tailwind CSS 4). Aplica el sistema de diseño de
la Parte 1 de este documento: paleta marfil cálida en light / violeta-carbón en dark, SIN
degradados en ningún lugar, tipografía Montserrat Alternates (display) + Plus Jakarta Sans
(body), radios 6/10/14/20/28/999px, accesibilidad AA con foco visible siempre.

NAVEGACIÓN — FloatingNav (navbar flotante reposicionable, se monta en TODAS las páginas del
dashboard salvo login):

Es una "pill" flotante, `position: fixed`, que puede vivir en 4 posiciones de pantalla —
izquierda (centrada verticalmente a 12px del borde izquierdo), derecha (centrada verticalmente a
12px del borde derecho), arriba (centrada horizontalmente a 12px del borde superior), o abajo
(centrada horizontalmente a 12px del borde inferior). La posición activa se guarda en
`localStorage` bajo la key `navbar_position` y se restaura al recargar (con un whitelist de los 4
valores válidos, default `'left'`).

Cuando la pill está en posición izquierda/derecha, sus items se apilan en columna y solo muestran
el ícono. Cuando está arriba/abajo, se apilan en fila y el item activo (o el que tiene el mouse
encima) se expande para mostrar también su etiqueta de texto, con una transición suave de
max-width/opacity.

Items de navegación (en este orden), cada uno con un ícono, una etiqueta, un color de fondo claro
y un color de ícono saturado — todos ya definidos, no inventes otros:

| Ruta | Ícono | Etiqueta | Color fondo (claro) | Color ícono (saturado) |
|---|---|---|---|---|
| /hiring-processes | grid/layout | Procesos | #EDE9FE | #7C3AED |
| /question-sets | mensaje/chat | Preguntas | #D1FAE5 | #059669 |
| /hiring-processes/new | signo + | Nuevo | #DBEAFE | #2563EB |
| /dashboard | gráfico de barras | Dashboard | #FEF3C7 | #D97706 |
| /metrics | signo $ | Costos | #FCE7F3 | #DB2777 |

Un 7mo item, "Config" (ícono de engranaje, fondo #F1F5F9, ícono #475569, ruta /settings), aparece
SOLO si el usuario tiene rol ADMIN — nunca para RECRUITER ni TA_LEADER.

El item activo se determina por coincidencia de prefijo de ruta (ej: cualquier ruta que empiece
con /hiring-processes activa el item "Procesos", excepto /hiring-processes/new que activa "Nuevo"
por separado).

Al final de la pill, un divisor delgado y luego un avatar circular (36px) con la inicial del rol
del usuario en blanco sobre relleno SÓLIDO (no degradado) del color primario. Al hacer click en el
avatar se abre un popover pequeño con: 3 flechas para mover la navbar a cada una de las otras 3
posiciones, un separador, y un botón "Cerrar sesión" en rojo.

NAVEGACIÓN — Header (barra de encabezado de cada página, va DEBAJO de FloatingNav, arriba del
contenido de la página):

Interfaz: `{ title: string; subtitle?: string; children?: ReactNode; rightBelow?: ReactNode }`.
Layout: a la izquierda, título (20px bold, tipografía display) y subtítulo opcional (12px, texto
muted) apilados. A la derecha: un input de búsqueda con ícono de lupa (oculto en mobile), un botón
de campana de notificaciones (con un punto rojo indicador), un ThemeToggle (sol/luna), un chip con
avatar circular (inicial de rol, relleno sólido del color primario) + nombre de rol legible
("Administrador"/"Reclutador"/"TA Leader"), y finalmente el slot `children` (para el botón de
acción principal de esa página, ej. "Nuevo proceso"). Si se pasa `rightBelow`, se renderiza en una
segunda fila debajo del cluster derecho.

REGLA DE DATOS: no inventes campos que no aparezcan explícitamente en el bloque de tipos de la
sección de página que sigue a este bloque común.
```

### 2.2 Button

Interfaz exacta:
```ts
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}
```
Estilos por variante (relleno sólido, nunca degradado): `primary` = fondo `--color-primary`, texto
blanco, hover `--color-primary-dark`. `accent` = fondo `--color-accent-dark` (para cumplir
contraste con texto blanco), hover un tono más oscuro. `secondary` = fondo `--color-primary-light`,
texto `--color-primary`. `ghost` = transparente, texto `--color-text`, hover
`--color-bg-subtle`. `danger` = fondo `--color-coral`, texto blanco, hover `--color-coral-dark`.
`outline` = fondo `--color-surface`, borde `--color-border`, texto `--color-text`. Tamaños: `sm`
(12px texto, padding compacto), `md` (14px, default), `lg` (14px, más padding). Radio:
`--radius-md`. Cuando `loading` es true, muestra un spinner SVG animado a la izquierda del texto y
desactiva el botón.

### 2.3 Badge (dos componentes)

```ts
interface MatchBadgeProps { category: 'HIGH' | 'MEDIUM' | 'LOW'; percentage?: number; }
interface StatusBadgeProps { status: 'DRAFT' | 'READY_FOR_MATCH' | 'CVS_UPLOADED' | 'MATCHING' | 'PROFILING_CONFIGURED' | 'COMPLETED'; }
```
`MatchBadge`: pill con punto de color + etiqueta + porcentaje opcional en negrita. Mapeo real:
HIGH → label "Alto", color esmeralda; MEDIUM → label "Medio", color ámbar; LOW → label "Bajo",
color rojo. `StatusBadge`: pill de color sólido tenue con texto del color base. Mapeo real de
label por estado: `DRAFT` → "Borrador" (neutro), `READY_FOR_MATCH` → "JD Lista" (azul),
`CVS_UPLOADED` → "CVs Cargados" (violeta), `MATCHING` → "En Match..." (ámbar),
`PROFILING_CONFIGURED` → "Match Completado" (teal/esmeralda), `COMPLETED` → "Completado"
(esmeralda). No renombres ni agregues estados.

### 2.4 Card (familia de 4 subcomponentes)

`Card`, `CardHeader`, `CardContent`, `CardFooter` — cada uno acepta `{ children, className?, style? }`
y se componen anidados (`<Card><CardHeader>...</CardHeader><CardContent>...</CardContent></Card>`).
Fondo `--color-surface`, borde `--color-border` 1px, radio `--radius-md`, padding `20px`.

### 2.5 CircularProgress

```ts
interface CircularProgressProps {
  value: number; size?: number; strokeWidth?: number;
  color?: string; trackColor?: string; label?: string; sublabel?: string;
}
```
Anillo SVG de progreso (arco proporcional a `value` sobre 100) con el valor numérico centrado y un
`label`/`sublabel` opcionales debajo. Color de trazo y de pista (track) configurables, default al
color primario y a `--color-bg-subtle`.

### 2.6 Input / Textarea / Select

Tres componentes de formulario, todos con `label?: string; error?: string; hint?: string;` además
de las props HTML nativas correspondientes (`InputHTMLAttributes`, `TextareaHTMLAttributes`, y
`options: {value, label}[]` obligatorio para `Select`). Borde `--color-border`, foco con anillo del
color primario, estado de error con borde/texto `--color-coral`. Radio `--radius-sm`.

### 2.7 UploadCvsModal

```ts
interface UploadCvsModalProps { isOpen: boolean; onClose: () => void; processId: string; }
```
Modal de subida de CVs con zona de drag & drop multi-archivo (también click para abrir selector de
archivos del sistema). Extensiones permitidas: `.pdf, .docx, .doc, .jpg, .jpeg, .png, .webp, .tiff,
.bmp` — los archivos con otra extensión se rechazan antes de subir. Al confirmar, sube todos los
archivos y muestra un spinner de carga; al terminar, una pantalla de éxito con el conteo de
archivos subidos. Nota: hoy no valida tamaño de archivo en el cliente (el límite se aplica solo en
el servidor) — esto es comportamiento esperado a preservar, no un bug a corregir en el rediseño
visual.

### 2.8 PdfPreviewModal

```ts
interface PdfPreviewModalProps { isOpen: boolean; onClose: () => void; title: string; fileUrl: string; }
```
Modal con un `<iframe>` que muestra el documento en `fileUrl`, con un spinner de carga que se
reinicia cada vez que cambia `fileUrl` (porque en algunas pantallas el modal permanece montado y
solo cambia la URL). Incluye botones "Abrir en pestaña nueva" y "Descargar". Bloquea el scroll de
la página de fondo mientras está abierto.

### 2.9 ThemeToggle (nuevo componente — no existe hoy, créalo)

Botón solo-ícono (sol cuando el tema activo es oscuro, luna cuando es claro), `aria-label="Cambiar
tema"`, alterna entre los dos estados descritos en la Parte 1.4.

---

## 3. Páginas

> Cada subsección trae su propio "Prompt v0" ya armado con el Bloque Común de la Parte 2.1 más los
> datos y componentes específicos de esa pantalla. Pégalo completo en un chat nuevo de v0.

### 3.1 Login — `/login`

**Propósito:** pantalla de autenticación, sin navegación (no lleva FloatingNav ni Header — es un
layout standalone). Tiene 3 vistas dentro del mismo componente: `login` (formulario email +
contraseña), `forgot` (pedir email para recuperar contraseña), `sent` (confirmación de envío).

**Datos:**
```ts
interface LoginFormValues { email: string; password: string; }
interface AuthResponse { access_token: string; refresh_token?: string; role: 'ADMIN' | 'RECRUITER' | 'TA_LEADER'; }
```

**Interacciones:** validación de formulario (email válido, password no vacío) antes de enviar;
estado de error si las credenciales son incorrectas; link "¿Olvidaste tu contraseña?" que cambia a
la vista `forgot`; en `forgot`, un input de email y botón de envío que lleva a la vista `sent` con
un mensaje de confirmación y un link para volver a `login`.

**Prompt v0:**
> Genera la página de login de RIWI MATCH (plataforma de matching de CVs con IA), Next.js 16 App
> Router, TypeScript, Tailwind CSS 4. Aplica el sistema de diseño de la Parte 1 de este documento:
> paleta marfil cálida (`--color-bg #F5F0E6`, `--color-surface #FFFCF6`) en modo claro y
> violeta-carbón en modo oscuro, tipografía Montserrat Alternates (títulos) + Plus Jakarta Sans
> (cuerpo), SIN degradados en ningún lugar — usa relleno sólido `--color-primary #7C3AED` para el
> botón principal. Layout centrado, tarjeta de login sobre el fondo marfil (no blanco puro), con
> logo/nombre "RIWI MATCH" arriba. Formulario con los 3 estados descritos arriba
> (`login`/`forgot`/`sent`), usando los componentes Input y Button ya especificados en la Parte 2
> de este documento (mismas props/estilos). Incluye un `ThemeToggle` en una esquina. No inventes
> más campos que `email`/`password` para el login.

---

### 3.2 Dashboard — `/dashboard`

**Propósito:** pantalla de inicio del dashboard — panorama general de los procesos de contratación.

**Datos:**
```ts
type ProcessStatus = 'DRAFT' | 'READY_FOR_MATCH' | 'CVS_UPLOADED' | 'MATCHING' | 'PROFILING_CONFIGURED' | 'COMPLETED';
interface HiringProcess {
  id: string; name: string; job_title: string; area: string; seniority: string;
  status: ProcessStatus; budget_max_usd: number; created_at: string; updated_at: string;
}
```

**Interacciones:** KPIs derivados de contar procesos por grupo de estado (activos = DRAFT +
READY_FOR_MATCH + CVS_UPLOADED; en matching = MATCHING; completados = PROFILING_CONFIGURED +
COMPLETED); un gráfico de barras de procesos por área; una tabla de "procesos recientes"
(ordenados por `created_at` desc, los últimos 5-8) con `StatusBadge`, clicable para ir al detalle.

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/dashboard` de RIWI MATCH: `Header` con `title="Dashboard"` y subtítulo con el
> conteo total de procesos. Debajo, 3-4 tarjetas de KPI (usa el patrón de "chip circular de color
> sólido" de la Parte 1.8 para cada ícono, NO degradados): Activos, En Matching, Completados,
> Total — con los conteos derivados de los `HiringProcess` reales según los grupos de estado de
> arriba. Debajo, un gráfico de barras (procesos agrupados por `area`) usando colores sólidos de la
> paleta de marca, sin degradados en las barras. Debajo, una tabla "Procesos recientes" (name,
> job_title, area, `StatusBadge` de estado, fecha) con toda la fila clicable hacia el detalle del
> proceso. No inventes métricas que no se puedan derivar de los campos de `HiringProcess` listados
> arriba.

---

### 3.3 Hiring Processes — listado — `/hiring-processes`

**Propósito:** listado principal de todos los procesos de contratación, con búsqueda, filtro por
estado y acciones rápidas por fila.

**Datos:** el mismo `HiringProcess`/`ProcessStatus` de la sección 3.2.

**Interacciones:** buscador de texto libre (nombre/cargo/área); 4 tarjetas de estadística que
funcionan también como **filtros clicables** (Activos / En Matching / Completados / Total — al
hacer click filtran la tabla por ese grupo de estado, y vuelven a "Total" si se hace click de
nuevo sobre el filtro ya activo); tabla con fila **completamente clicable** hacia el detalle del
proceso; un botón de menú de acciones rápidas por fila (Ver detalle / Duplicar / Archivar) que NO
debe disparar la navegación de la fila al hacer click (evento independiente).

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/hiring-processes` de RIWI MATCH: `Header` con `title="Procesos de
> contratación"`, botón "+ Nuevo proceso" en el slot derecho del Header (relleno sólido
> `--color-primary`, sin degradado — esto reemplaza un hero con degradado que se probó antes y se
> descartó explícitamente). Debajo, 4 tarjetas de estadística clicables (Activos/En
> Matching/Completados/Total) con chip de ícono circular de color sólido cada una (violeta, ámbar,
> esmeralda, azul), que funcionan como toggle de filtro sobre la tabla de abajo, con un indicador
> visual claro de cuál está activa (borde de acento sólido, no una opacidad tenue). Debajo, una
> barra con input de búsqueda y un selector de estado en forma de chip con ícono de embudo. Debajo,
> una tabla (columnas: Proceso, Cargo · Área, Seniority, Estado con `StatusBadge`, Fecha, menú de
> acciones) con toda la fila clicable y un botón de menú (⋯) por fila que abre un dropdown con "Ver
> detalle"/"Duplicar"/"Archivar" sin disparar el click de la fila. Estado vacío con ícono de
> maletín en chip circular cuando no hay procesos.

---

### 3.4 Nuevo proceso — wizard — `/hiring-processes/new`

**Propósito:** formulario de 3 pasos para crear un proceso de contratación nuevo.

**Datos:**
```ts
interface CreateHiringProcessDTO {
  name: string; job_title: string; area: string; seniority: string;
  budget_max_usd: number; match_weights_override?: Record<string, number>;
}
```

**Interacciones:** stepper de 3 pasos con tabs/indicador de progreso (no círculos numerados
genéricos): **Paso 1 — Básicos** (nombre del proceso, cargo, área, seniority, presupuesto máximo,
panel opcional de pesos de match); **Paso 2 — Job Description** (toggle entre subir archivo
`.pdf/.docx/.doc/.txt` o pegar texto directo); **Paso 3 — Subir CVs** (reutiliza el patrón de
drag&drop de `UploadCvsModal` de la Parte 2.7, pero embebido en la página, no en un modal). Botones
"Atrás"/"Siguiente" y "Crear proceso" al final.

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/hiring-processes/new` de RIWI MATCH: `Header` con `title="Nuevo proceso"`.
> Stepper horizontal de 3 pasos con subrayado de color sólido en el paso activo (sin degradado).
> Implementa los 3 pasos descritos arriba usando los componentes Input/Textarea/Select de la Parte
> 2.6 y el patrón de subida de archivos de la Parte 2.7 (drag&drop, extensiones permitidas
> `.pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.tiff,.bmp` para CVs; `.pdf,.docx,.doc,.txt` para la JD).
> Navegación entre pasos con botones Atrás/Siguiente, validación antes de avanzar. No inventes
> campos fuera de `CreateHiringProcessDTO`.

---

### 3.5 Detalle de proceso — `/hiring-processes/[id]`

**Propósito:** vista de detalle de un proceso: la Job Description activa, el estado del pipeline,
y las acciones de match/subida de CVs.

**Datos:**
```ts
interface HiringProcess {
  id: string; name: string; job_title: string; area: string; seniority: string;
  status: ProcessStatus; budget_max_usd: number; created_at: string; updated_at: string;
  job_description_data?: {
    jd_id: string; version: number; text_preview: string; jd_raw_text: string;
    jd_file_url: string | null; original_filename: string | null; created_at: string;
  } | null;
}
```
Pipeline de 4 pasos derivados del estado: `jd` (DRAFT/READY_FOR_MATCH) → `cvs`
(CVS_UPLOADED/MATCHING) → `match` (PROFILING_CONFIGURED) → `profiling` (COMPLETED).

**Interacciones:** panel con la JD activa (preview de texto + botón para ver el archivo completo
en un `PdfPreviewModal`, Parte 2.8); indicador de pipeline horizontal (4 pasos, el paso actual
resaltado con color sólido); botones de acción que **solo aparecen habilitados según el estado
real del proceso** (ej: "Ejecutar match" solo si hay JD y CVs cargados — nunca inventes un botón
que permita saltarse un paso); botón para abrir `UploadCvsModal` (Parte 2.7).

**Regla de estado importante:** la interfaz nunca decide por sí sola si una transición es válida —
solo refleja/deshabilita según el estado actual del proceso. No agregues botones de acción que no
tengan sentido para el estado mostrado (ej: no muestres "Ejecutar match" si el proceso todavía está
en `DRAFT` sin JD).

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/hiring-processes/[id]` de RIWI MATCH: `Header` con el nombre del proceso como
> título. Indicador de pipeline horizontal de 4 pasos (JD → CVs → Match → Profiling) con el paso
> activo en color sólido `--color-primary` y los pasos completados en `--color-mint-dark` — sin
> degradado entre pasos. Panel de Job Description con preview de texto y botón "Ver documento
> completo" que abre un modal tipo `PdfPreviewModal` (Parte 2.8). Botones de acción (Subir CVs →
> abre modal tipo `UploadCvsModal` de la Parte 2.7; Ejecutar match) que se muestran deshabilitados
> con un tooltip explicativo cuando el estado del proceso no los permite — nunca los ocultes del
> todo, para que el usuario entienda qué falta. No inventes transiciones de estado.

---

### 3.6 Candidatos — Kanban dual — `/hiring-processes/[id]/candidates`

**Propósito:** tablero Kanban de candidatos de un proceso, agrupados por categoría de match, con
selección para iniciar llamadas de profiling.

**Datos:**
```ts
type MatchCategory = 'HIGH' | 'MEDIUM' | 'LOW';
interface Candidate {
  id: string; name: string; last_name: string; email: string; phone: string;
  cv_file_url: string; created_at: string; updated_at: string;
}
interface DualMatchCandidate {
  id: string; process_id: string; candidate_id: string; status: string;
  match_percentage: number; match_category?: MatchCategory | null;
  cv_match_percentage: number; cv_match_category: MatchCategory;
  human_notes?: string; candidate: Candidate;
}
interface DualKanbanResponse {
  HIGH: DualMatchCandidate[]; MEDIUM: DualMatchCandidate[]; LOW: DualMatchCandidate[];
  LOADED: DualMatchCandidate[]; PARSING: DualMatchCandidate[];
}
```

**Interacciones:** 5 columnas (Alto/Medio/Bajo/Cargados/Procesando), cada `DualMatchCandidate`
como una tarjeta con nombre, `MatchBadge` (Parte 2.3) y porcentaje; toggle de vista para mostrar
match de CV, de profiling, o ambos lado a lado; checkbox de selección múltiple sobre las tarjetas
para elegir candidatos e iniciar llamadas de voz de profiling en bloque.

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/hiring-processes/[id]/candidates` de RIWI MATCH: `Header` con "Candidatos" y
> un toggle de vista (CV / Profiling / Ambos) en `rightBelow`. Tablero Kanban de 5 columnas
> horizontales con scroll horizontal propio (Alto=esmeralda, Medio=ámbar, Bajo=rojo,
> Cargados=neutro, Procesando=azul — encabezado de columna en chip de color sólido, sin
> degradado). Cada tarjeta de candidato usa `MatchBadge` (Parte 2.3), checkbox de selección, y
> muestra nombre + porcentaje. Barra de acción flotante inferior que aparece cuando hay candidatos
> seleccionados, con botón "Iniciar llamadas de profiling". No inventes una 6ta categoría de match
> — solo existen HIGH/MEDIUM/LOW más los buckets de estado LOADED/PARSING.

---

### 3.7 Ranking — `/hiring-processes/[id]/ranking`

**Propósito:** tabla de ranking detallado de candidatos con desglose de match y acciones de
contacto.

**Datos:**
```ts
interface BreakdownItem { raw_score?: number; weighted_score?: number; weight: number; }
interface MatchBreakdown {
  technical_skills?: BreakdownItem; relevant_experience?: BreakdownItem; seniority?: BreakdownItem;
  industry_domain?: BreakdownItem; languages?: BreakdownItem; education_certifications?: BreakdownItem;
}
interface CandidateListItem {
  rank: number; process_candidate_id: string; candidate_id: string; name: string;
  email: string; phone: string | null; status: string; match_percentage: number;
  match_category: string | null; normalized_cv_url: string | null; city?: string | null;
  match_summary?: string; strengths?: string[]; gaps?: string[]; breakdown?: MatchBreakdown;
}
```

**Interacciones:** tabla ordenada por `rank`, buscador; fila expandible que muestra
`match_summary`, `strengths`/`gaps` como listas, y un desglose de barras horizontales por cada
clave de `MatchBreakdown` (6 posibles: habilidades técnicas, experiencia relevante, seniority,
industria/dominio, idiomas, educación/certificaciones); acciones de contacto (llamar/email) con
íconos; botón para ver/descargar el CV (abre `PdfPreviewModal`, Parte 2.8, usando
`normalized_cv_url`).

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/hiring-processes/[id]/ranking` de RIWI MATCH: `Header` con "Ranking de
> candidatos". Tabla con columnas rank/nombre/`MatchBadge`/ciudad/acciones, buscador arriba. Cada
> fila es expandible: al expandir, muestra `match_summary`, dos columnas de listas (fortalezas en
> verde, brechas en rojo — íconos de check/x, NO fondos degradados) y barras de progreso
> horizontales de color sólido para cada clave presente en `breakdown` (usa el label legible en
> español de cada clave: "Habilidades técnicas", "Experiencia relevante", "Seniority",
> "Industria/Dominio", "Idiomas", "Educación/Certificaciones"). Acciones de contacto con íconos de
> teléfono/email, y botón para ver el CV que abre un modal tipo `PdfPreviewModal` (Parte 2.8). No
> inventes claves de breakdown fuera de las 6 listadas.

---

### 3.8 Metrics / Costos — `/metrics`

**Propósito:** dashboard de costos de IA del sistema (OpenAI + ElevenLabs).

**Datos:**
```ts
interface MetricsDashboard {
  total_cost_usd: number;
  cost_by_process: Array<{ process_id: string; process_name: string; total_cost: number; candidate_count: number }>;
  cost_by_user: Array<{ user_id: string; user_name: string; total_cost: number }>;
  cost_by_operation: Array<{ operation_type: string; total_cost: number; count: number }>;
  daily_costs: Array<{ date: string; cost: number }>;
}
```

**Interacciones:** KPI de costo total; gráfico de línea de `daily_costs` (costo por día); gráfico
de barras horizontal de `cost_by_operation`; lista/tabla de los procesos con mayor costo
(`cost_by_process`, top 5-10, ordenado desc).

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/metrics` de RIWI MATCH: `Header` con "Costos". Tarjeta de KPI grande con
> `total_cost_usd` formateado en dólares. Gráfico de línea de `daily_costs` (fecha vs costo) en
> color sólido `--color-primary`, sin degradado ni relleno de área en degradado — si hay relleno
> de área, que sea un color plano semitransparente, no un gradiente. Gráfico de barras horizontal
> de `cost_by_operation` (cada barra en un color sólido distinto de la paleta de marca). Lista de
> "Top procesos por costo" ordenada por `total_cost` desc, mostrando `process_name`,
> `candidate_count` y `total_cost`. No inventes más categorías de costo que las de
> `cost_by_operation`.

---

### 3.9 Profiling — `/profiling`

**Propósito:** panel de monitoreo de llamadas de voz de profiling (ElevenLabs + Twilio) en curso.

**Datos:**
```ts
type ProfilingStatus = 'PENDING' | 'CALLING' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER';
interface BackendProfilingRunItem {
  id: string; candidate_name: string; status: string; call_attempts: number;
  advancement_probability: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  started_at: string | null; completed_at: string | null;
}
```

**Interacciones:** 4 tarjetas de estadística (llamadas totales, en curso, completadas, fallidas);
una nota visible sobre el límite de concurrencia de llamadas simultáneas (el sistema solo permite
un número máximo configurado de llamadas activas al mismo tiempo); lista/tabla de
`BackendProfilingRunItem` con `call_attempts` y probabilidad de avance.

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/profiling` de RIWI MATCH: `Header` con "Llamadas de profiling". 4 tarjetas de
> estadística con chip de ícono circular de color sólido (violeta=totales, azul=en curso,
> esmeralda=completadas, rojo=fallidas), sin degradados. Un aviso/banner pequeño (relleno sólido
> `--color-accent-light`, texto `--color-accent-dark`) indicando el límite de llamadas
> concurrentes configurado. Tabla/lista de llamadas con nombre del candidato, estado (usa un badge
> de color por cada uno de los 5 `ProfilingStatus`), intentos de llamada, y probabilidad de avance
> (HIGH/MEDIUM/LOW) con color esmeralda/ámbar/rojo. No inventes más estados de llamada que los 5
> listados.

---

### 3.10 Question Sets — listado — `/question-sets`

**Propósito:** listado de sets de preguntas de profiling reutilizables.

**Datos:**
```ts
interface QuestionSet {
  id: string; name: string; description?: string; version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'; created_at: string; updated_at: string;
}
```

**Interacciones:** grid de tarjetas clicables (toda la tarjeta navega al detalle), cada una con
nombre, descripción, versión y un badge de estado (3 valores posibles); botón "+ Nuevo set" en el
Header.

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/question-sets` de RIWI MATCH: `Header` con "Sets de preguntas" y botón "+
> Nuevo set" (relleno sólido, sin degradado). Grid de tarjetas (usa el componente `Card` de la
> Parte 2.4) completamente clicables hacia el detalle, mostrando `name`, `description`, `version`
> y un badge de color sólido por `status` (DRAFT=neutro, ACTIVE=esmeralda, ARCHIVED=texto muted).
> Estado vacío con ícono de mensaje en chip circular. No inventes más de los 3 valores de `status`.

---

### 3.11 Nuevo Question Set — `/question-sets/new`

**Propósito:** formulario para crear un set de preguntas de profiling con un builder dinámico de
preguntas.

**Datos:**
```ts
type QuestionType = 'OPEN' | 'CLOSED' | 'MULTIPLE_CHOICE' | 'YES_NO' | 'NUMERIC' | 'SCALE';
interface ProfilingQuestion {
  order_index: number; text: string; type: QuestionType;
  expected_answer?: string; positive_keywords: string[]; risk_keywords: string[];
  weight: number; is_critical: boolean; eval_criteria?: string;
}
interface CreateQuestionSetDTO { name: string; description?: string; questions: ProfilingQuestion[]; }
```

**Interacciones:** campos de nombre/descripción del set; builder dinámico donde se pueden
agregar/quitar/reordenar preguntas; cada pregunta tiene texto, tipo (selector de los 6 tipos),
campos condicionales según el tipo (respuesta esperada para CLOSED/YES_NO/NUMERIC, tags de
keywords para OPEN/MULTIPLE_CHOICE), un input de peso numérico con una suma total visible de todos
los pesos, y un checkbox "Crítica" (`is_critical`).

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/question-sets/new` de RIWI MATCH: `Header` con "Nuevo set de preguntas".
> Formulario con nombre/descripción arriba (componentes Input/Textarea de la Parte 2.6), y debajo
> un builder de preguntas: cada pregunta es una tarjeta (Parte 2.4) con número de orden, input de
> texto de la pregunta, selector de tipo (6 valores), campos condicionales según el tipo
> seleccionado, input de peso, campo de tags para keywords positivas/de riesgo, y checkbox
> "Pregunta crítica". Un contador visible de la suma total de pesos de todas las preguntas. Botón
> "+ Agregar pregunta" y opción de eliminar/reordenar cada una. Botón final "Crear set". No
> inventes tipos de pregunta fuera de los 6 listados.

---

### 3.12 Detalle / edición de Question Set — `/question-sets/[id]`

**Propósito:** ver y editar un set de preguntas existente, incluyendo su ciclo de vida de estado.

**Datos:** mismo `QuestionSet` de 3.10, con su array `questions: ProfilingQuestion[]` completo (de
3.11), más gestión de `status` (DRAFT → ACTIVE → ARCHIVED).

**Interacciones:** mismo builder de preguntas que 3.11 pero en modo edición (precargado); un
selector/acciones para cambiar el `status` del set; guardar cambios.

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/question-sets/[id]` de RIWI MATCH: `Header` con el nombre del set como
> título y un badge de `status` junto al título. Reutiliza exactamente el mismo builder de
> preguntas de la sección 3.11 de este documento, mostrando los datos ya cargados en modo edición.
> Agrega controles para transicionar el `status` (DRAFT → ACTIVE, o ACTIVE → ARCHIVED) como botones
> de acción claros, sin degradados. Botón "Guardar cambios".

---

### 3.13 Settings — `/settings` (solo rol ADMIN)

**Propósito:** panel de configuración administrativa — gestión de usuarios, parámetros de IA e
integraciones. Ruta gateada: **solo accesible/visible para usuarios con rol ADMIN**, el mismo gate
que controla si aparece el item "Config" en `FloatingNav` (Parte 2.1).

**Datos:**
```ts
interface User { id: string; name: string; last_name: string; email: string; role: 'ADMIN' | 'RECRUITER' | 'TA_LEADER'; status: 'ACTIVE' | 'SUSPENDED'; }
interface AIModelConfig { id: string; task_type: string; provider: 'OPENAI' | 'ANTHROPIC' | 'ELEVENLABS'; model_name: string; is_active: boolean; }
interface AIPrompt { id: string; task_type: string; version_name: string; system_prompt_text: string; is_active: boolean; }
```

**Interacciones:** 3 tabs (Usuarios / Parámetros de IA / Integraciones). Tab Usuarios: tabla de
`User` con rol y estado, acciones de suspender/reactivar. Tab Parámetros de IA: lista de
`AIModelConfig` (qué modelo usa cada tipo de tarea) y `AIPrompt` (versión de prompt activa por
tarea). Tab Integraciones: estado de conexión de servicios externos (informativo).

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera la página `/settings` de RIWI MATCH: `Header` con "Configuración". 3 tabs (Usuarios /
> Parámetros de IA / Integraciones) con indicador de tab activa en color sólido, sin degradado.
> Tab Usuarios: tabla con nombre, email, `role`, badge de `status` (ACTIVE=esmeralda,
> SUSPENDED=rojo), botón de acción por fila. Tab Parámetros de IA: lista de tarjetas (Parte 2.4)
> mostrando `task_type`, `provider`, `model_name` y un toggle de `is_active`, más una sección de
> `AIPrompt` mostrando `version_name` y si está activo. Tab Integraciones: tarjetas simples de
> estado de servicios externos (informativo, sin acciones). Deja una nota visible en el prompt: esta
> página es solo para rol ADMIN, no agregues un punto de entrada público a ella.

---

### 3.14 Shell del dashboard — `(dashboard)/layout.tsx`

**Propósito:** no es una página en sí, es el layout que envuelve todas las páginas del dashboard:
monta `FloatingNav`, aplica un padding dinámico al contenido según en qué posición esté la navbar
(para que el contenido nunca quede tapado por la pill flotante), y redirige a `/login` si no hay
sesión activa.

**Comportamiento a preservar exactamente:** el padding del `<main>` cambia según la posición de
`FloatingNav` — más padding en el lado donde está la navbar (ej: si está a la izquierda, más
padding-left; si está arriba, más padding-top), padding estándar menor en los otros 3 lados.
Mientras se verifica la sesión, se muestra un spinner de carga centrado en pantalla completa. Si no
hay sesión, no se renderiza nada (redirige).

**Prompt v0:**
> [Pega aquí el Bloque Común de la Parte 2.1 de este documento]
>
> Genera el layout del dashboard de RIWI MATCH: fondo `--color-bg` (marfil cálido) en toda la
> pantalla, monta `FloatingNav` (Parte 2.1) y dentro de `<main>` aplica un padding que varíe según
> la posición configurada de la navbar (más espacio en el lado donde está la pill, para que nunca
> tape el contenido). Spinner de carga centrado (círculo con borde de color sólido `--color-primary`
> y `border-top` transparente, animación de rotación) mientras se verifica la sesión. El contenido
> real de cada página se recibe como `children`.

---

## 4. Orden recomendado de generación

1. **Parte 1 + Parte 2** (sistema de diseño + componentes compartidos) — fija los tokens y el
   Bloque Común que todo lo demás reutiliza.
2. **3.1 Login** — valida paleta/tipografía/dark mode sin la complejidad de la navegación.
3. **3.14 Layout del dashboard** — fija el shell (FloatingNav + Header + padding dinámico) que
   todas las páginas siguientes van a compartir.
4. **3.2 Dashboard** — valida el theming de gráficos (se reutiliza en Metrics y Profiling).
5. **3.3 Hiring Processes (listado)** — valida el patrón de tabla/filtros/badges (se reutiliza en
   Ranking y Question Sets).
6. **3.4 Wizard nuevo proceso** — valida el patrón de stepper/formulario (se reutiliza en el
   builder de Question Sets).
7. **3.5 Detalle de proceso** — valida el patrón de panel + pipeline + modales embebidos.
8. **3.6 Candidates Kanban** y **3.7 Ranking** — las pantallas más ricas en datos, se hacen una vez
   validados los patrones simples.
9. **3.8 Metrics** y **3.9 Profiling** — reutilizan gráficos/stat-cards ya validados en el paso 4.
10. **3.10 → 3.12 Question Sets** (listado, nuevo, detalle) — reutilizan tabla + formulario de los
    pasos 5 y 6.
11. **3.13 Settings** — al final, porque reutiliza tabs + formularios de todo lo anterior y está
    gateada a rol ADMIN.
