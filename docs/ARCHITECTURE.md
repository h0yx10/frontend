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
