# Eventia — Logistics Command (Frontend)

Aplicación Angular 17 standalone (SPA) para el **Organizador de Eventos Independientes**
(Mini-proyecto 1, 750018C Proyecto Integrador I). Construida con Tailwind CSS, Angular
Material y SCSS, siguiendo `core` / `shared` / `features` y Atomic Design. El flujo es
página → store reactivo (signals) → servicio HTTP → API REST.

La interfaz sigue el diseño "Eventia — Logistics Command": fondo oscuro, acento índigo,
tipografía Inter + JetBrains Mono para etiquetas técnicas (badges, encabezados de tabla,
la regla de orden de "Hoy"). Es un dashboard de escritorio (sidebar + panel lateral
contextual), no una versión móvil apilada.

## Tareas núcleo cubiertas

- **T1 — Plan inicial**: crear evento (`/crear`) y descomponerlo en subtareas logísticas
  con plazo y horas estimadas desde el detalle del evento (`/evento/:id`).
- **T2 — Vista "Hoy"** (`/hoy`): agrupa gestiones en *Vencidas / Para hoy / Próximas*,
  ordenadas por plazo y desempatadas por menor esfuerzo estimado; incluye filtros por
  evento y por estado, la regla de orden siempre visible, 4 tarjetas KPI (vencidas, para
  hoy, completadas en 7 días con tendencia, próximas 7 días) y un panel lateral con las
  gestiones clave del día y los eventos que requieren atención hoy.
- **T3 — Reprogramar y conflicto**: al reprogramar una subtarea se valida la sobrecarga
  diaria (suma de horas planificadas por día, excluyendo `DONE`) contra el límite
  configurable del organizador. Si se detecta conflicto, se ofrecen 3 alternativas:
  mover a otro día (con sugerencias), reducir horas estimadas, o posponer. Además, "Hoy"
  muestra un banner proactivo cuando reprogramar la gestión más urgente al día siguiente
  generaría sobrecarga, con acceso directo a resolverlo.
- **T4 — Progreso**: registrar ejecución (`Hecha` / `Pospuesta` + nota opcional) y ver, en
  el detalle del evento, las subtareas organizadas en 3 columnas por estado
  (Pendiente / Pospuesta / Hecha) junto con la barra de progreso de preparación.
- **US-12 — Capacidad diaria**: visible en el sidebar y editable desde `/progreso`
  (1–16 h, por defecto 6 h).
- **US-11 — Autenticación**: login/registro con sesión por organizador, o "Continuar con
  usuario demo" (un clic, sin credenciales); los eventos, subtareas y capacidad están
  aislados por `organizerId`.

## Uso

1. Ejecuta `npm install`.
2. Ejecuta `npm start`.
3. Abre `http://localhost:4200`. Serás redirigido a `/login`.
4. Pulsa "Continuar con usuario demo", o inicia sesión con `demo@eventos.test` / `demo1234`.
   La cuenta demo trae precargados los eventos de ejemplo (Boda Camila & Andrés,
   Lanzamiento Nova, Cumpleaños 50 — Don Roberto, Cierre de temporada) con una
   sobrecarga real sembrada para el día siguiente, para poder ver el banner de
   conflicto de "Hoy" en acción sin configurar nada.

## Backend / modo mock

`events-api` (Spring Boot) aún no expone controladores REST. Mientras tanto,
`src/app/core/mock/mock-api.interceptor.ts` simula exactamente el mismo contrato HTTP
documentado en el Backlog Refinado (mismas rutas, códigos de estado y sobre
`ApiResponse<T>`) usando `localStorage`, para que la aplicación funcione de punta a
punta hoy mismo:

- `POST/GET /auth/*`, `GET/POST/PATCH/DELETE /events`, `GET/POST/PATCH/DELETE /subtasks`,
  `PATCH /subtasks/:id/execute`, `PATCH /subtasks/:id/reschedule`,
  `POST /conflicts/overload`, `GET/PATCH /capacity`, `GET /today`.

Cuando el backend real esté disponible, apunta `runtimeConfig.apiUrl` a su URL y pon
`runtimeConfig.useMockApi = false` en `src/app/core/config/runtime-config.ts` — ningún
componente ni servicio de la capa de features necesita cambiar, porque todos hablan
HTTP contra ese mismo contrato.

## Estados y accesibilidad

Cada pantalla implementa los 4 estados mínimos (vacío, cargando, error, éxito) con
mensajes accionables (`Reintentar`, `Crear evento`, `Limpiar filtros`). Los diálogos
(`app-modal`) atrapan el foco (`cdkTrapFocus`), se cierran con `Escape`, usan
`role="dialog"` + `aria-modal` + `aria-labelledby`, y todos los controles interactivos
tienen anillo de foco visible, labels asociados y mensajes de error con `aria-describedby`.

## Despliegue

- Build de producción: `npm run build` (salida en `dist/events-frontend`).
- Pensado para desplegar en Vercel; configura `runtimeConfig.apiUrl` según el entorno.
