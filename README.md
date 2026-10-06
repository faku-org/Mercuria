# Polimorfismo

> Ejercicio de Programación Orientada a Objetos en TypeScript: cálculo polimórfico de
> sueldos de empleados, ampliado con naciones, estados, leyes, empresas, propiedades e IA.

El proyecto parte de los empleados y su `calcularSueldo()` y crece hacia un pequeño
modelo de dominio: naciones con leyes, estados, empresas con jerarquía, propiedades e
una IA con agentes. Los **requisitos mínimos ya están implementados** (cálculo
polimórfico de sueldos + CLI); los extras están en progreso
(ver [roadmap](docs/roadmap.md)).

## Estructura

```
polimorfismo/
├── src/
│   ├── domain/      Clases del dominio (Persona, Empleado, Nacion, Ley, ...)
│   ├── services/    Casos de uso (naciones.ts, nomina.ts)
│   ├── fixtures/    Datos de prueba (leyesBase.ts, empleadosBase.ts)
│   ├── cli.ts       CLI interactiva de nómina
│   ├── index.ts     Punto de entrada
│   └── debug.ts     Pruebas manuales
├── docs/            Documentación
├── requirements.md  Consigna original
├── tsconfig.json
├── package.json
└── .oxlintrc.json
```

## Tech stack

- TypeScript en modo `strict`, ejecutado con [Bun](https://bun.sh) (sin paso de build).
- `oxlint` para lint y `oxfmt` para formato.

## Empezar

Requiere Bun (hay `bun.lock`).

```bash
bun install
bun run start   # CLI interactiva
bun run demo    # nómina de ejemplo sin interacción
```

## Scripts

| Script           | Descripción                                            |
| ---------------- | ------------------------------------------------------ |
| `bun run start`  | Ejecuta la CLI interactiva (`src/index.ts`).           |
| `bun run demo`   | Imprime la nómina de ejemplo sin interacción.          |
| `bun run dev`    | Igual que `start`, con recarga al guardar (`--watch`). |
| `bun run check`  | Chequeo de tipos (`tsc --noEmit`).                     |
| `bun run lint`   | Lint con `oxlint`.                                     |
| `bun run format` | Formatea con `oxfmt`.                                  |

## Documentación

| Documento                                    | Contenido                                  |
| -------------------------------------------- | ------------------------------------------ |
| [docs/organizacion.md](docs/organizacion.md) | Carpetas, capas y reglas de dependencia.   |
| [docs/convenciones.md](docs/convenciones.md) | Nombres, exports y cómo agregar un módulo. |
| [docs/dominio.md](docs/dominio.md)           | Clases del dominio y su estado.            |
| [docs/roadmap.md](docs/roadmap.md)           | Checklist de mínimos, extras y pendientes. |

## Estado

- **Listo**: requisitos mínimos (cálculo polimórfico de sueldos con `EmpleadoFijo`,
  `EmpleadoPorHora` y `Vendedor`), CLI interactiva, lint/formato y scripts.
- **Pendiente**: los extras (Propiedad, jerarquía de Empresa, lógica de AI/agentes) y la
  UI. Detalle en [docs/roadmap.md](docs/roadmap.md).
