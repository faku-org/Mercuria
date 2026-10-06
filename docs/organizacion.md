# Organización del repositorio

Este documento describe cómo está armado el repo y qué reglas respetar para que
siga siendo navegable a medida que crece.

## Árbol de carpetas

```
polimorfismo/
├── src/                     Backend / dominio
│   ├── domain/              Clases del modelo (una clase por archivo)
│   ├── services/            Casos de uso sobre el dominio
│   ├── fixtures/            Datos de prueba / semilla
│   ├── server/              API HTTP
│   │   ├── index.ts         Entrada del servidor (listen)
│   │   ├── app.ts           Rutas (GraphQL + estáticos)
│   │   ├── schema.ts        Esquema GraphQL (typeDefs + resolvers)
│   │   ├── mundo.ts         Estado del mundo + DTOs + acciones
│   │   └── db.ts            Persistencia SQLite (bun:sqlite)
│   ├── cli.ts               CLI interactiva
│   ├── index.ts             Punto de entrada de la CLI
│   └── debug.ts             Espacio para pruebas manuales
├── tests/                   Tests del dominio
├── web/                     Frontend (workspace de Bun)
│   ├── src/
│   │   ├── App.tsx          Shell + navegación
│   │   ├── api.ts           Cliente de la API
│   │   ├── types.ts         Tipos espejo de los DTOs
│   │   ├── components/      UI reutilizable
│   │   └── views/           Vistas por pestaña
│   ├── index.html
│   └── vite.config.ts
├── docs/                    Documentación (este directorio)
├── package.json             Scripts + workspaces (["web"])
└── tsconfig.json
```

## Capas y responsabilidad

| Carpeta         | Responsabilidad                                                       | Ejemplos                               |
| --------------- | --------------------------------------------------------------------- | -------------------------------------- |
| `src/domain/`   | Modelar entidades. Solo estado + comportamiento propio de la entidad. | `Persona`, `Empleado`, `Nacion`, `Ley` |
| `src/services/` | Orquestar el dominio: listar, calcular, aplicar leyes.                | `nomina.ts`, `leyes.ts`                |
| `src/fixtures/` | Instanciar datos de ejemplo para pruebas o demos.                     | `leyesBase.ts`, `aiBase.ts`            |
| `src/server/`   | Exponer el dominio por HTTP y mapear a DTOs JSON.                     | `mundo.ts`, `app.ts`                   |
| `src/` (raíz)   | Punto de entrada y scripts sueltos.                                   | `index.ts`, `debug.ts`                 |
| `tests/`        | Tests ejecutados con `bun test`.                                      | `dominio.test.ts`                      |
| `web/`          | Interfaz de usuario (consume la API por HTTP).                        | `App.tsx`, `views/`                    |

## Regla de dependencia (dirección de los imports)

```
index.ts / cli.ts / server/          web/
        │                              │  (HTTP)
        ▼                              ▼
   services/ ──────► domain/      /api/*
        │
        ▼
   fixtures/ ──────► domain/
```

- `domain/` **no** puede importar de `services/`, `fixtures/` ni `server/`.
- `services/` y `fixtures/` pueden importar de `domain/`.
- `server/` importa de `fixtures/` y `services/` (nunca al revés).
- `web/` **no** importa código del backend: se comunica solo por HTTP. Sus tipos en
  `web/src/types.ts` son espejo de los DTOs de `server/mundo.ts`.

### Imports de solo tipo

Para no crear ciclos en tiempo de ejecución (por ejemplo `Nacion` ↔ `Ley`, `AI` ↔
`Agente`), cuando un import se usa **únicamente como tipo** se marca con `import type`:

```ts
import type Nacion from "./Nacion"; // solo tipo -> se borra al compilar
import Ley from "./Ley"; // valor -> se mantiene (extends, new, etc.)
```

Esto es obligatorio en este repo porque `tsconfig.json` activa `verbatimModuleSyntax`.

## Dónde va cada cosa nueva

| Si querés agregar...        | Va en...                                             |
| --------------------------- | ---------------------------------------------------- |
| Una clase del modelo        | `src/domain/MiClase.ts`                              |
| Un cálculo sobre el dominio | `src/services/miServicio.ts`                         |
| Datos de ejemplo            | `src/fixtures/miBase.ts`                             |
| Un endpoint nuevo           | `src/server/app.ts` (+ DTO en `mundo.ts`)            |
| Una pantalla o vista nueva  | `web/src/views/MiVista.tsx` (+ pestaña en `App.tsx`) |
| Un componente reutilizable  | `web/src/components/`                                |
| Un test                     | `tests/miArea.test.ts`                               |

## Por qué `src/domain` y no `data`

El nombre `data/` sugería archivos de datos cuando en realidad contiene clases. Los
datos de prueba viven en `fixtures/`, y los modelos en `domain/`.
