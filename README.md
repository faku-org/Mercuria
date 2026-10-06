# Polimorfismo

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
polimorfismo/
├── src/                 Backend / dominio
│   ├── domain/          Clases del modelo (Empleado, Nacion, Ley, Propiedad, AI, ...)
│   ├── services/        Casos de uso (nomina.ts, leyes.ts, naciones.ts)
│   ├── fixtures/        Datos de prueba (leyesBase, empleadosBase, aiBase, ...)
│   ├── server/          API HTTP (Elysia): app.ts, mundo.ts, index.ts
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
- **API**: Elysia + `@elysiajs/cors`.
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
bun run serve     # API en http://localhost:3011
bun run web:dev   # UI en http://localhost:3010 (proxy /api → 3011)
```

## Scripts

| Script            | Descripción                                  |
| ----------------- | -------------------------------------------- |
| `bun run start`   | CLI interactiva (`src/index.ts`).            |
| `bun run demo`    | Nómina de ejemplo sin interacción.           |
| `bun run serve`   | API HTTP en `:3011` (`src/server/index.ts`). |
| `bun run web:dev` | UI en `:3010` con proxy a la API.            |
| `bun run check`   | Chequeo de tipos (`tsc --noEmit`).           |
| `bun test`        | Tests del dominio.                           |
| `bun run lint`    | Lint con `oxlint`.                           |
| `bun run format`  | Formatea con `oxfmt`.                        |

## Documentación

| Documento                                    | Contenido                                  |
| -------------------------------------------- | ------------------------------------------ |
| [docs/organizacion.md](docs/organizacion.md) | Carpetas, capas y reglas de dependencia.   |
| [docs/convenciones.md](docs/convenciones.md) | Nombres, exports y cómo agregar un módulo. |
| [docs/dominio.md](docs/dominio.md)           | Clases del dominio y su estado.            |
| [docs/api-y-ui.md](docs/api-y-ui.md)         | Endpoints de la API y vistas de la UI.     |
| [docs/roadmap.md](docs/roadmap.md)           | Checklist de mínimos, extras y pendientes. |

## Estado

- **Listo**: requisitos mínimos; extras (leyes con efecto/alcance, prioridad estado,
  propiedades con compra/venta, jerarquía de empresa, IA con agentes); tests del dominio;
  API HTTP; UI web base.
- **Pendiente**: ver [docs/roadmap.md](docs/roadmap.md).
