# Rediseño del frontend — Premium Glass / Ámbar

**Fecha:** 2026-05-15
**Estado:** Diseño aprobado, pendiente de plan de implementación

## Objetivo

Hacer que el frontend de la PWA Gym Tracker se vea más profesional y atractivo
mediante un overhaul visual completo. La app es de uso personal; la prioridad es
que se sienta linda y cómoda de usar. El rediseño es puramente visual: no cambia
funcionalidad, navegación, lógica de datos ni dependencias.

Se apoya en las skills de diseño instaladas (`high-end-visual-design`,
`design-taste-frontend`, `minimalist-ui`, `redesign-existing-projects`),
adoptando el arquetipo "Ethereal Glass" de `high-end-visual-design`.

## Decisiones tomadas

- **Alcance:** overhaul visual completo (las 13 pantallas y todos los componentes).
- **Audiencia:** uso personal.
- **Dirección visual:** Premium / Glass — negro OLED, tarjetas tipo vidrio,
  tipografía refinada, motion suave (estilo Linear / Apple).
- **Acento:** ámbar.
- **Tipografía:** se mantienen Geist Sans + Geist Mono; se refina la jerarquía.
- **Movimiento:** sutil y rápido; sin librerías de animación nuevas.
- **Modo claro:** fuera de alcance — la app es dark-only.

## Enfoque de ejecución

Estrategia "token-first": los tokens de diseño viven en el bloque `@theme` de
`app/globals.css` y los primitivos de `components/ui/` los consumen vía clases
Tailwind. Redefinir tokens y primitivos primero hace que gran parte del rediseño
se propague a las pantallas automáticamente. El barrido de pantallas posterior
ajusta lo que no se resuelve solo. La alternativa (rediseñar cada pantalla de
cero) duplicaría trabajo y dejaría inconsistencias.

## Lenguaje visual (tokens)

### Fondo y atmósfera

- Fondo base negro OLED: `--color-bg: #070707` (hoy `#0a0a0a`).
- Capa de fondo fija con un glow radial ámbar muy sutil arriba a la derecha,
  opacidad ~0.06: `radial-gradient(circle at 75% 12%, rgba(245,158,11,0.07), #070707 55%)`.
  Da profundidad sin distraer durante el uso.
- Actualizar `viewport.themeColor` y `globals.css` (`html`/`body`) al nuevo fondo.

### Superficies (glass)

- Tarjetas translúcidas: relleno `rgba(255,255,255,0.04)`, borde hairline
  `rgba(255,255,255,0.08)`.
- `backdrop-blur` donde la superficie se apoya sobre el gradiente (header, nav,
  diálogos).
- Se elimina la sombra dura actual (`--shadow-card: 0 1px 2px rgb(0 0 0 / 0.4)`).
  La elevación se logra con un inset highlight superior:
  `inset 0 1px 0 rgba(255,255,255,0.05)` más la diferencia de translucidez.
- `--shadow-overlay` para diálogos se mantiene pero se suaviza (más difusa).

### Acento ámbar

- `--color-accent: #f59e0b`.
- `--color-accent-fg: #2a1c08` (texto oscuro sobre ámbar).
- CTA principal: gradiente `linear-gradient(135deg, #f59e0b, #d97706)`.
- `--color-danger` se mantiene (`#ef4444`).

### Radios

- `--radius-control: 0.75rem` se mantiene.
- `--radius-card: 1rem` sube a `1.25rem` para reforzar la estética premium,
  aplicado de forma consistente en todos los primitivos de superficie.

### Tipografía (Geist, refinada)

- Geist Sans (UI/cuerpo) y Geist Mono (números) se mantienen.
- Títulos grandes con tracking negativo (`letter-spacing: -0.02em`).
- Micro-labels en mayúscula con tracking positivo (~`0.1em–0.12em`).
- Introducir pesos 500/600 para jerarquía sutil (hoy se usa mayormente 400/700).
- `tabular-nums` en todos los números de datos: sets, reps, kg, duración, stats,
  contadores.

### Movimiento

- Se mantiene el token `--animate-fade-in` (fade existente).
- Feedback de presión: `active:scale-[0.98]` + leve cambio de opacidad, easing
  rápido (`ease-out`, ~150–180ms).
- Sin librerías de animación nuevas.

## Primitivos de UI (`components/ui/`)

Re-skin sobre la estructura existente — sin componentes nuevos. Las APIs
(props, variantes `cva`) se mantienen salvo donde se indique. Los tests
existentes de cada primitivo deben seguir pasando.

- **Card** — relleno glass translúcido, borde hairline, inset highlight. Variante
  `padding` se mantiene. Se agrega una variante/prop `interactive` para tarjetas
  que funcionan como link (hover sutil + press feedback).
- **BigButton** — `primary` pasa a gradiente ámbar; `secondary` a glass con borde
  hairline; `ghost` y `danger` adaptados. El `active:scale-[0.98]` existente se
  conserva, se afina el easing.
- **IconButton** — fondo glass circular sutil; estado activo con tinte ámbar.
- **NumberStepper** — controles +/- más definidos con press feedback; número
  central en Geist Mono con `tabular-nums`.
- **Switch** — track glass, thumb que desliza con ease rápido; estado on en ámbar.
- **Chip** — borde hairline; estado activo con relleno ámbar tenue.
- **Field** — input glass; focus ring ámbar fino (reemplaza el ring genérico).
- **EmptyState** — hereda glass; ícono e ilustración sobre el nuevo fondo.
- **ConfirmDialog** / **ExercisePicker** — superficie glass; `backdrop-blur` de
  fondo más marcado para los overlays.
- **Skeleton** — shimmer alineado a las nuevas superficies translúcidas.

## Componentes app-level

- **AppShell** — header translúcido con `backdrop-blur` que se despega del
  contenido al hacer scroll; respeta `pt-safe`.
- **BottomNav** — barra glass flotante con `backdrop-blur`, respeta `pb-safe`;
  ítem activo con ícono ámbar e indicador.
- **RestTimer** — panel glass flotante; acento ámbar.
- **SyncBadge** — estados (sincronizado / pendiente / error) con el nuevo
  vocabulario de color.
- **ToastContainer / Toast** — superficie glass; acento ámbar para estados.
- **SetRow** — números en Geist Mono `tabular-nums`; check de set completado en
  ámbar.
- **ProgressChart** — línea/área en ámbar; grilla hairline; números de ejes en
  mono.

## Tratamiento por pantalla

Las 13 pantallas mantienen estructura, contenido y flujos actuales. Es un re-skin
coherente; no hay pantallas nuevas ni cambios de navegación.

| Pantalla | Tratamiento |
|---|---|
| `app/page.tsx` (Home) | Header translúcido, tarjeta de rutina activa destacada, grid de stats con números mono. Mockup de referencia aprobado. |
| `app/login` | Fondo con glow ámbar, tarjeta glass centrada, botón con gradiente ámbar. |
| `app/auth/callback` | Estado de carga sobre el nuevo fondo. |
| `app/routines` (lista) | Tarjetas glass; rutina activa con acento ámbar; botón "Crear" consistente. |
| `app/routines/new` | Formulario con `Field` glass; `NumberStepper` refinado. |
| `app/routines/[id]` (editor) | Lista de ejercicios ordenable con drag handles claros; controles refinados. |
| `app/train` | Redirección/entrada a sesión; sin UI propia relevante. |
| `app/train/[id]` (sesión en vivo) | Ejercicio actual destacado; `SetRow` con números mono; ejercicios terminados colapsados (ya existe); `RestTimer` glass. |
| `app/train/[id]/finish` | Resumen con stats grandes en mono; tono de logro con el acento. |
| `app/history` (lista) | Sesiones como tarjetas glass con fecha, duración y volumen. |
| `app/history/[id]` (detalle) | Desglose por ejercicio con el mismo tratamiento. |
| `app/stats` | `ProgressChart` ámbar + grilla hairline; tarjetas de métricas con números grandes mono. |
| `app/settings` | Filas glass agrupadas; `Switch` nuevos; secciones con micro-labels en mayúscula. |

## Orden de ejecución

Ordenado para que cada etapa sea verificable y la app nunca quede en estado roto:

1. **Tokens** — reescribir el bloque `@theme` de `app/globals.css` (fondo, colores
   glass, acento ámbar, sombras inset, escala tipográfica) y agregar la capa de
   glow de fondo. Máximo impacto: al terminar, la app ya cambia globalmente.
2. **Primitivos** — actualizar los componentes de `components/ui/`. Los tests
   existentes deben seguir pasando.
3. **Componentes app-level** — `AppShell`, `BottomNav`, `RestTimer`, `SyncBadge`,
   `Toast`, `SetRow`, `ProgressChart`, `Skeleton`.
4. **Barrido de pantallas** — las 13 pantallas en orden de visibilidad:
   Home → sesión en vivo → finalizar sesión → rutinas (lista/nueva/editor) →
   historial (lista/detalle) → stats → settings → auth.
5. **Pulido final** — revisar `pt-safe`/`pb-safe`, focus states, consistencia de
   movimiento; probar en navegador (golden path y edge cases).

## Fuera de alcance

- Cambios de funcionalidad, navegación o lógica de datos.
- Nuevas dependencias o librerías de animación.
- Modo claro (la app es dark-only).
- Pantallas o flujos nuevos.

## Verificación

- Después de cada etapa: lint + suite de tests existente debe pasar.
- El barrido de pantallas se valida visualmente en el navegador (golden path y
  edge cases: estados vacíos, sesión activa vs. sin rutina, errores de sync).
- No se introducen regresiones funcionales: el rediseño no toca lógica.
