# Arquitectura del Frontend

## Estructura de capas

```
src/app/
├── core/       # Infraestructura transversal
├── shared/     # Componentes y utilidades reutilizables
├── features/   # Módulos funcionales
└── layouts/    # Layouts de la aplicación
```

### `core/` — Infraestructura transversal

Contiene servicios, guards, interceptors y stores que son fundamentales para el funcionamiento de la aplicación. No depende de ninguna otra capa interna.

### Autenticación en `core/auth/`

La autenticación completa vive en `core`, incluidos sus componentes de login, registro
y cuenta. Se organiza en las siguientes capas:

```text
core/auth/
├── models/        # Modelos de sesión, usuario y contratos HTTP
├── components/    # Login/registro y cuenta, con sus plantillas
├── services/      # AuthService: peticiones HTTP a /api/auth
├── store/         # AuthStore: sesión, token, usuario, roles, persistencia y expiración
├── guards/        # Protección de rutas según sesión y permisos
└── interceptors/  # Envío del token Bearer
```

El flujo es `Componente → AuthStore → AuthService → HTTP`. Los guards, interceptores
y el arranque de la aplicación consultan el store. `AuthService` no conserva estado.
Los componentes de autenticación pueden importar componentes de UI de `shared/`;
esta es una excepción explícita a la restricción general de `core/`.

El login y registro comparten la composición **Eventia Órbita**. `LoginPageComponent`
conserva los Reactive Forms, validaciones y llamadas al store. Los campos se componen
con `shared/ui/molecules/form-field`; el logo horizontal y el botón de autenticación
reutilizan los átomos `brand-logo` y `button` (apariencia `orbit`).
El átomo decorativo `starfield` cubre el fondo de toda la pantalla de autenticación;
las estrellas quedan fuera de los renderers orbitales. La presentación de las órbitas
es transparente, sin borde ni tarjeta exterior.

`shared/ui/organisms/orbit-scene` es una ilustración independiente de la autenticación.
Recibe `phases: readonly OrbitPhase[]` y `centerLabel`; las fases definen gestiones,
radio, velocidad y tono. Su progreso es una demostración visual, no datos de la cuenta.
Three.js se importa dinámicamente mediante una fábrica de renderizado reemplazable en
pruebas. La escena corre fuera de la zona de Angular, se pausa al ocultarse y libera
geometrías, materiales, texturas y observadores al desmontarse. Usa un SVG con la misma perspectiva y animación cuando WebGL falla. Ambos motores
respetan pausa y visibilidad. La animación arranca sin interacción incluso con movimiento reducido; el botón de pausa
es el control para detenerla.

La paleta `--auth-*` y `--orbit-*` se define junto a los tokens del tema; sólo los
componentes de autenticación y su ilustración la consumen. La geometría, proyección y
animaciones específicas se encapsulan en SCSS y en el renderer del organismo. Las
coordenadas geométricas se actualizan por frame sin disparar detección de cambios;
los cambios de progreso sí actualizan señales de Angular.

La recuperación de contraseña y la ayuda abren `InfoDialogComponent`. Recuperación
explica que el flujo aún no está disponible; el pie muestra Español como idioma actual.

El cierre de sesión usa `POST /api/auth/logout` sin body y con el token Bearer actual.
`AuthStore.logout()` limpia la sesión en memoria y almacenamiento tras 200 o 401.
Los errores de red y 500 conservan la sesión y se muestran con una opción de reintento.
`clearSession()` realiza únicamente la limpieza local ante expiración, sesión inválida
o eliminación de cuenta, sin enviar otra petición de logout.

### `shared/` — Componentes y utilidades reutilizables

Contiene componentes UI organizados por Atomic Design y utilidades compartidas. No depende de ninguna otra capa interna.

| Subcarpeta      | Responsabilidad                                                |
| --------------- | -------------------------------------------------------------- |
| `ui/atoms/`     | Componentes atómicos (button, input, select, spinner, etc.)    |
| `ui/molecules/` | Componentes moleculares (search-box, confirm-dialog, etc.)     |
| `ui/organisms/` | Componentes organismo (data-table, sidebar, topbar, etc.)      |
| `ui/templates/` | Templates de página reutilizables                              |
| `validators/`   | Validadores personalizados para Reactive Forms                 |
| `utils/`        | Funciones utilitarias compartidas                              |

### `features/` — Módulos funcionales

Cada feature es un módulo funcional independiente con su propia ruta, componentes, servicios y store.

### Rutas principales

| Ruta           | Feature / componente                    | Guards                       |
| -------------- | --------------------------------------- | ---------------------------- |
| `/hoy`         | `features/today` · TodayPage            | `authGuard`, `organizerGuard`|
| `/crear`       | `features/events` · EventCreatePage     | `authGuard`, `organizerGuard`|
| `/evento/:id`  | `features/events` · EventDetailPage     | `authGuard`, `organizerGuard`|
| `/actividades` | `features/events` · ActivitiesPage      | `authGuard`, `organizerGuard`|
| `/progreso`    | `features/events` · EventsProgressPage  | `authGuard`, `organizerGuard`|
| `/cuenta`      | `core/auth` · AccountPage               | `authGuard`                  |

### Shell de las pantallas autenticadas

`core/layout/ShellLayoutComponent` es la ruta padre de todas las páginas privadas (`/hoy`,
`/actividades`, `/progreso`, `/crear`, `/evento/:id`, `/cuenta`); el login queda como ruta de
pantalla completa. Compone la navegación con `shared/ui/organisms/app-sidebar`, un organismo
**presentacional**: recibe ítems, usuario y carga diaria, y emite `search`, `logout` y `navigated`.

La barra lateral contiene el logo, la campana, la búsqueda global (⌘K / Ctrl K → `/progreso?q=`),
la navegación «Planificación» (Hoy, Actividades, Progreso), la tarjeta «Carga de hoy» y el acceso a
«Mi cuenta» con cierre de sesión. Por debajo de `lg` se convierte en un drawer con una cabecera compacta.

El shell es la raíz de composición de la zona privada y por eso conecta stores de `features/`
(`CapacityStore` y `WorkloadStore`) con el organismo; el organismo en sí no conoce ninguna feature.
`WorkloadStore` (`features/today/store`, singleton) expone las horas planificadas hoy y el contador de
«Hoy»: la pantalla Hoy lo actualiza con su tablero y el shell lo refresca al terminar cada navegación.

### Indicadores de carga

Los guards (`organizerGuard` consulta `/auth/me`) se resuelven antes de activar la ruta, así que la
pantalla no cambia mientras tanto. `core/layout/NavigationProgressService` expone la navegación en curso
(con 120 ms de margen para no parpadear en cambios instantáneos):

- `AppComponent` muestra un spinner a pantalla completa hasta completar la primera navegación.
- La barra lateral muestra un spinner en el ítem pulsado mientras su navegación está pendiente, y en
  «Hoy» y «Carga de hoy» mientras `WorkloadStore` consulta por primera vez (luego, un spinner pequeño junto
  al título en cada actualización).
- Hoy muestra en su primera carga un esqueleto con la forma del tablero; al llegar los datos, estadísticas,
  filtros, columnas y widgets entran escalonados con `.real`. Las demás páginas usan `loading-state`, y el
  botón de autenticación, el mismo `spinner`.

### Primitivas visuales compartidas

Las pantallas Hoy, Actividades, Progreso y Nuevo evento comparten una misma capa visual:

| Pieza | Ubicación | Uso |
| ----- | --------- | --- |
| `.surface-card`, `.input-control`, `.btn-primary`, `.btn-ghost` | `styles.scss` (`@layer components`) | Tarjetas, campos y botones; sólo componen tokens del tema |
| `page-header` | `shared/ui/molecules` | Sobretítulo, título, subtítulo y acciones |
| `segmented-control`, `search-box`, `workload-card` | `shared/ui/molecules` | Filtros, búsqueda con debounce y carga diaria |
| `progress-bar`, `progress-ring`, `status-badge`, `check-button`, `brand-mark` | `shared/ui/atoms` | Indicadores y controles básicos |
| `spinner` | `shared/ui/atoms` | Indicador de carga (estilo iOS, toma `currentColor`); sigue animado con movimiento reducido porque sólo cambia la opacidad |
| `loading-state` | `shared/ui/molecules` | Carga de una página: spinner y mensaje |
| `skeleton` | `shared/ui/atoms` | Bloque de esqueleto con brillo; `today-board-skeleton` lo compone con la forma del tablero Hoy |
| `.real` | `styles.scss` | Entrada escalonada del contenido real tras un esqueleto (`[style.animation-delay.ms]`) |
| `today-column`, `today-event-card`, `today-item`, `stat-card` | `features/today/components` | Tablero Hoy |

Los colores con transparencia (`bg-primary/15`) **no** se generan con los tokens actuales (son
`var(--…)` opacos); para fondos tenues se usan los tokens sólidos `primary-soft`, `success-soft`,
`warning-soft` y `danger-soft`.

### Feature `today/` — búsqueda de eventos

La vista Hoy incluye filtros de búsqueda sobre los eventos mostrados (texto libre sobre
nombre, lugar, tipo y subtareas, sin distinguir tildes ni mayúsculas, y selector de evento).
El estado vive en `TodayStore.search` (`TodaySearch`) y el componente lo aplica con `computed`.
El campo de texto es `shared/ui/molecules/search-box` (Reactive Forms con debounce de 250 ms) y el selector de evento filtra en el cliente sobre el mismo estado.

## Estilos

Todos los componentes se estilizan con Tailwind CSS usando los tokens del tema
(`bg-surface`, `text-ink`, `text-muted`, `border-border`, `text-accent`, etc.) definidos en
`tailwind.config.js`. No se usan colores ni estilos en línea arbitrarios.

## Restricciones de importación

Las siguientes reglas de importación garantizan la separación de responsabilidades y evitan dependencias circulares:

| Capa        | Puede importar de                                  | NO puede importar de                    |
| ----------- | -------------------------------------------------- | --------------------------------------- |
| `core/`     | Dependencias externas (Angular, RxJS, NgRx)        | `features/`, `shared/`, `layouts/`      |
| `shared/`   | Dependencias externas (Angular, Material, Tailwind)| `core/`, `features/`, `layouts/`        |
| `features/` | `core/`, `shared/`, dependencias externas          | `layouts/`, otros features              |
| `layouts/`  | `core/`, `shared/`, dependencias externas          | `features/`                             |

### Reglas adicionales

- Un feature **no** puede importar de otro feature directamente.
- Los componentes de negocio viven dentro de su feature, no en `shared/`.
- Los componentes reutilizables van en `shared/ui/`.

## Atomic Design para UI

Los componentes reutilizables se organizan en tres niveles:

- **Atoms:** Componentes básicos e indivisibles (button, input, select).
- **Molecules:** Combinaciones de atoms con lógica propia (search-box, confirm-dialog).
- **Organisms:** Componentes complejos que combinan molecules y atoms (data-table, sidebar).

## Flujo de datos

```
Componente → Store → Servicio → HTTP → Microservicio
    ↑                                       │
    └────── Signal (estado reactivo) ←──────┘
```

1. El componente invoca un método del store.
2. El store llama al servicio correspondiente.
3. El servicio realiza la petición HTTP (con interceptors).
4. La respuesta actualiza el estado del store.
5. Los signals del store notifican al componente automáticamente.

## Reactive Forms

Todos los formularios usan Reactive Forms (`FormGroup`, `FormControl`) con validación programática. No se usan Template-driven Forms.
