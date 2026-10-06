# Organización del repositorio

Este documento describe cómo está armado el repo y qué reglas respetar para que
siga siendo navegable a medida que crece.

## Árbol de carpetas

```
polimorfismo/
├── src/
│   ├── domain/        Clases del modelo de dominio (una clase por archivo)
│   ├── services/      Casos de uso y operaciones sobre el dominio
│   ├── fixtures/      Datos de prueba / semilla (listas de objetos)
│   ├── cli.ts         CLI interactiva de nómina
│   ├── index.ts       Punto de entrada (antes Main.ts)
│   └── debug.ts       Espacio para pruebas manuales
├── docs/              Documentación del proyecto (este directorio)
├── .gitignore
├── .oxlintrc.json
├── package.json
├── tsconfig.json
├── bun.lock
├── README.md
└── requirements.md
```

## Capas y responsabilidad

| Carpeta         | Responsabilidad                                                       | Ejemplos                               |
| --------------- | --------------------------------------------------------------------- | -------------------------------------- |
| `src/domain/`   | Modelar entidades. Solo estado + comportamiento propio de la entidad. | `Persona`, `Empleado`, `Nacion`, `Ley` |
| `src/services/` | Orquestar el dominio: listar, calcular, aplicar leyes, persistir.     | `naciones.ts`                          |
| `src/fixtures/` | Instanciar datos de ejemplo para pruebas o demos.                     | `leyesBase.ts`                         |
| `src/` (raíz)   | Punto de entrada y scripts sueltos.                                   | `index.ts`, `debug.ts`                 |

## Regla de dependencia (dirección de los imports)

```
index.ts / debug.ts
        │
        ▼
   services/  ──────►  domain/
        │
        ▼
   fixtures/  ──────►  domain/
```

- `domain/` **no** puede importar de `services/` ni de `fixtures/`.
- `services/` y `fixtures/` pueden importar de `domain/`.
- `index.ts` orquesta todo.

### Imports de solo tipo

Para no crear ciclos en tiempo de ejecución (por ejemplo `Nacion` ↔ `Ley`), cuando un
import se usa **únicamente como tipo** se marca con `import type`:

```ts
import type Nacion from "./Nacion"; // solo tipo -> se borra al compilar
import Ley from "./Ley"; // valor -> se mantiene (extends, new, etc.)
```

Esto es obligatorio en este repo porque `tsconfig.json` activa `verbatimModuleSyntax`.

## Por qué `src/domain` y no `data`

El nombre `data/` sugería archivos de datos cuando en realidad contiene clases. Los
datos de prueba viven en `fixtures/`, y los modelos en `domain/`.
