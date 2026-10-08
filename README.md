# Mercuria

> Ejercicio de Programación Orientada a Objetos en TypeScript: cálculo polimórfico de
> sueldos de empleados, ampliado con naciones, estados, leyes, empresas, propiedades e IA.

El proyecto parte de `Empleado.calcularSueldo()` y crece hacia un modelo de dominio
completo: naciones y estados con leyes (con **efecto**, **magnitud** y **alcance**),
empresas con jerarquía y propiedades, y una IA con agentes cuyo costo y sueldo también
responden a las leyes.

Además de la CLI incluye una **API HTTP** (Elysia) y una **UI web** (React 19 + Vite +
TailwindCSS v4) para explorar el dominio en el navegador.

## Estructura

```
mercuria/
├── src/                 Backend / dominio
│   ├── domain/          Clases del modelo (Empleado, Nacion, Ley, Propiedad, AI, ...)
│   ├── services/        Casos de uso (nomina.ts, leyes.ts, naciones.ts, prediccion.ts)
│   ├── fixtures/        Datos de prueba (leyesBase, empleadosBase, aiBase, ...)
│   ├── server/          API HTTP (Elysia): app.ts, mundo.ts, schema.ts, reloj.ts, eventos.ts, db.ts
│   ├── cli.ts           CLI interactiva de nómina
│   ├── index.ts         Punto de entrada de la CLI
│   └── debug.ts         Espacio para pruebas manuales
├── tests/               Tests del dominio (`bun test`)
├── web/                 Frontend (React 19 + Vite + TailwindCSS v4)
├── docs/                Documentación
├── requirements.md      Consigna original
├── package.json
└── tsconfig.json
```

## Tech stack

- **TypeScript** en modo `strict`, ejecutado con [Bun](https://bun.sh) (sin paso de build).
- **API**: GraphQL con `graphql-yoga` montado sobre Elysia.
- **Persistencia**: SQLite vía `bun:sqlite` (sin dependencias externas).
- **Web**: React 19, Vite, TailwindCSS v4, `lucide-react`.
- **Lint/formato**: `oxlint` / `oxfmt`. **Tests**: `bun test`.

## Empezar

Requiere Bun (hay `bun.lock`).

```bash
bun install
bun run start   # CLI interactiva
bun run demo    # nómina de ejemplo sin interacción
bun test        # tests del dominio
```

## API + UI

```bash
bun run serve     # UI + API en http://localhost:3011/ (GraphQL en /graphql)
bun run web:dev   # UI en modo dev (:3010, proxy a :3011)
```

El estado se persiste en SQLite (`POLIMORFISMO_DB`, por defecto `data/mundo.db`).
Detalle del modelo económico en [docs/economia.md](docs/economia.md).

## Scripts

| Script              | Descripción                                          |
| ------------------- | ---------------------------------------------------- |
| `bun run start`     | CLI interactiva (`src/index.ts`).                    |
| `bun run demo`      | Nómina de ejemplo sin interacción.                   |
| `bun run serve`     | UI + API GraphQL en `:3011` (`src/server/index.ts`). |
| `bun run web:dev`   | UI en `:3010` con proxy a la API.                    |
| `bun run web:build` | Genera `web/dist` (lo sirve `serve` en `/`).         |
| `bun run check`     | Chequeo de tipos (`tsc --noEmit`).                   |
| `bun test`          | Tests del dominio.                                   |
| `bun run lint`      | Lint con `oxlint`.                                   |
| `bun run format`    | Formatea con `oxfmt`.                                |

## Documentación

| Documento                                    | Contenido                                                             |
| -------------------------------------------- | --------------------------------------------------------------------- |
| [docs/organizacion.md](docs/organizacion.md) | Carpetas, capas y reglas de dependencia.                              |
| [docs/convenciones.md](docs/convenciones.md) | Nombres, exports y cómo agregar un módulo.                            |
| [docs/dominio.md](docs/dominio.md)           | Clases del dominio y su estado.                                       |
| [docs/economia.md](docs/economia.md)         | Modelo económico, simulación en vivo y predicción.                    |
| [docs/api-y-ui.md](docs/api-y-ui.md)         | GraphQL, SSE en vivo, predicción, vistas de la UI y persistencia.     |
| [docs/issues.md](docs/issues.md)             | Tablero de issues (simulación en vivo y modelo realista).             |
| [docs/roadmap.md](docs/roadmap.md)           | Checklist de mínimos, extras y pendientes.                            |

## Estado

- **Listo**: requisitos mínimos; extras (leyes con efecto/alcance, prioridad estado,
  propiedades con compra/venta, jerarquía de empresa, IA con agentes); **modelo económico**
  (productividad, PIB global, mercado de acciones, adquisiciones, recursos y ambiente);
  tests del dominio; API **GraphQL**; UI web; persistencia en **SQLite**; **simulación en
  tiempo real** (reloj en el servidor + stream SSE + barra de control) y **predicción** por
  simulación aislada; **simulación autónoma** (avanza sin clientes conectados) con
  **usuarios** (handle + PIN) que **fundan y adquieren empresas** y reciben un **resumen de
  ausencia**.
- **Pendiente**: modelo realista (sector, objetivo, IA, estatales, clientes). Ver
  [docs/issues.md](docs/issues.md) y [docs/roadmap.md](docs/roadmap.md).
