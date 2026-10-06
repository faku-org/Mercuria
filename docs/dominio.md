# Modelo de dominio

Descripción de las clases que viven en `src/domain/`, con sus campos reales tal como
están en el código hoy. Los estados son: **implementada** (con lógica), **estructura**
(solo campos/constructor) o **pendiente** (archivo placeholder).

## Núcleo

### Persona — `domain/Persona.ts`

Clase base de las personas. **Implementada (estructura).**

| Campo             | Tipo      |
| ----------------- | --------- |
| `nombre`          | `string`  |
| `edad`            | `number`  |
| `dni`             | `string`  |
| `fechaNacimiento` | `Date`    |
| `direccion`       | `string`  |
| `estadoCivil`     | `string`  |
| `empleado`        | `boolean` |

### Empleado — `domain/Empleado.ts`

Hereda de `Persona`. **Implementada.**

- Campos propios: `sueldo: number`, `id: number`, `empresa: Empresa`.
- Constructor: `(sueldo, nombre, id, empresa)`.
- Método `calcularSueldo(): number` que devuelve el `sueldo` base; las subclases lo
  sobrescriben.

### Subclases de Empleado

| Clase             | Archivo                     | Regla de `calcularSueldo()`                  |
| ----------------- | --------------------------- | -------------------------------------------- |
| `EmpleadoFijo`    | `domain/EmpleadoFijo.ts`    | `$50.000` mensual (`SUELDO_MENSUAL`).        |
| `EmpleadoPorHora` | `domain/EmpleadoPorHora.ts` | `horasTrabajadas × tarifaPorHora`.           |
| `Vendedor`        | `domain/Vendedor.ts`        | `sueldo base + ventas × (comisión % / 100)`. |

### Jefe — `domain/Jefe.ts`

Hereda de `Empleado`. **Estructura.**

- Campos propios: `departamento: string`, `equipo: Empleado[]`.
- Hereda `calcularSueldo()` de `Empleado`.

### Empresa — `domain/Empresa.ts`

Entidad legal que agrupa empleados y propiedades. **Estructura.**

- Campos: `nombre`, `id`, `empleados: Empleado[]`, `capital`, `propiedades: string[]`.
- Pendiente: tipar `propiedades` como `Propiedad[]` e incorporar jerarquía y leyes.

### Sueldo — `domain/Sueldo.ts`

Representa una remuneración. **Estructura.**

- Campos: `monto: number`, `deduce: boolean`.
- Pendiente: distinguir sueldo fijo de variable y aplicar leyes.

## Naciones, estados y leyes

### Nacion — `domain/Nacion.ts`

**Estructura.**

- Campos: `nombre`, `id` (generado aleatorio), `iniciales` (derivadas del nombre),
  `capital`, `idioma`, `poblacion`, `leyes: Ley[]`.
- Método: `getNombre(): string`.
- El servicio `services/naciones.ts` expone `listarNaciones()` y `obtenerNaciones()`.

### Estado — `domain/Estado.ts`

Hereda de `Nacion`. **Estructura.**

- Campos propios: `override leyes: LeyEstatal[]`, `nacion: Nacion`.
- Constructor: `(nombre, capital, idioma, poblacion, nacion)`.
- El `id` usa las iniciales de su nación: `<Nacion iniciales>-<id>` (ej: `US-vkvguk`).
  Las `iniciales` propias del estado siguen derivándose de su nombre (se usan en las
  leyes estatales).

### Ley — `domain/Ley.ts`

**Estructura.**

- Campos: `nombre`, `id` (generado con formato), `descripcion`, `afecta: Nacion[]`,
  `activa: boolean`.
- Constructor: `(nombre, descripcion, nacion)`; la nación se registra en `afecta`.
- El `id` usa las iniciales de la nación: `<Nacion iniciales>-<fecha>-<id>`
  (ej: `US-2026-10-06-6pcm30`).
- Pendiente: modelar el **efecto** (positivo/negativo) y el concepto "afecta a todas
  las naciones" (hoy hay un `TODO` en el constructor).

### LeyEstatal — `domain/LeyEstatal.ts`

Hereda de `Ley`. **Estructura.**

- Campo propio: `estado: Estado[]`.
- Constructor: `(nombre, descripcion, estado)`.
- El `id` combina las iniciales de la nación y del estado:
  `<Nacion iniciales>-<Estado iniciales>-<fecha>-<id>` (ej: `US-CA-2026-10-06-9kqf5q`).

## AI y agentes

### AI — `domain/AI.ts`

**Estructura.**

- Campos: `nombre`, `modelo`, `id` (aleatorio), `empresaMatriz`, `asi`, `rogue`,
  `agentes: Agente[]`.
- Los agentes creados a partir de una AI se registran en su lista `agentes`.

### Agente — `domain/Agente.ts`

Hereda de `AI`. **Estructura.**

- Campo propio: `aiMatriz: AI`.
- Constructor: `(nombre, modelo, aiMatriz, rogue?, asi?)`. Al crearse hereda de su AI
  matriz la `empresaMatriz` y queda registrado en `aiMatriz.agentes`.
- El `id` usa las iniciales de su modelo: `<Modelo iniciales>-<id>` (ej: `CL-jel9nm`).

## Módulos pendientes

Archivos placeholder (aún sin implementar). El detalle del alcance está en
`requirements.md` y el estado en `roadmap.md`.

| Clase     | Archivo               | Idea general                                                                  |
| --------- | --------------------- | ----------------------------------------------------------------------------- |
| Propiedad | `domain/Propiedad.ts` | Objeto comprable/vendible, con precio, ubicación y dueño; afectado por leyes. |

## Identificadores

Los ids con formato se arman con las utilidades de `domain/identificadores.ts`:

- `iniciales(texto)`: varias palabras usan la primera letra de cada una
  (`"United States"` → `US`); una sola palabra usa sus dos primeras letras
  (`"Claude"` → `CL`).
- `fechaId(fecha?)`: fecha en formato `YYYY-MM-DD`.
- `idAleatorio(largo?)`: sufijo aleatorio corto en base 36.

| Entidad    | Formato                                              | Ejemplo                   |
| ---------- | ---------------------------------------------------- | ------------------------- |
| Estado     | `<Nacion iniciales>-<id>`                            | `US-vkvguk`               |
| Agente     | `<Modelo iniciales>-<id>`                            | `CL-jel9nm`               |
| Ley        | `<Nacion iniciales>-<fecha>-<id>`                    | `US-2026-10-06-6pcm30`    |
| LeyEstatal | `<Nacion iniciales>-<Estado iniciales>-<fecha>-<id>` | `US-CA-2026-10-06-9kqf5q` |

## Servicios — `src/services/`

| Función                     | Archivo                | Descripción                                        |
| --------------------------- | ---------------------- | -------------------------------------------------- |
| `listarNaciones(naciones)`  | `services/naciones.ts` | Imprime por consola y devuelve las naciones.       |
| `obtenerNaciones(naciones)` | `services/naciones.ts` | Versión `async` que delega en `listarNaciones`.    |
| `calcularNomina(empleados)` | `services/nomina.ts`   | Calcula el sueldo de cada empleado (polimorfismo). |
| `totalNomina(empleados)`    | `services/nomina.ts`   | Suma de todos los sueldos.                         |
| `imprimirNomina(empleados)` | `services/nomina.ts`   | Imprime la nómina con su total.                    |
| `formatearMoneda(monto)`    | `services/nomina.ts`   | Formatea un monto en formato es-AR.                |

## CLI — `src/cli.ts`

CLI interactiva (`bun run start`) que permite cargar la nómina de ejemplo, crear
empleados (fijo, por hora o vendedor), ver la nómina actual y vaciarla. Con la bandera
`--demo` (`bun run demo`) imprime la nómina de ejemplo sin interacción. `src/index.ts`
es el punto de entrada y delega en `src/cli.ts`.

## Datos de prueba — `src/fixtures/`

| Export                    | Archivo                     | Contenido                                                                          |
| ------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| `naciones` (default)      | `fixtures/nacionesBase.ts`  | 1 nación de ejemplo: United States.                                                |
| `nacionPrincipal` (named) | `fixtures/nacionesBase.ts`  | La nación anterior, para reutilizarla (por ejemplo, en `leyesBase`).               |
| `leyes` (default)         | `fixtures/leyesBase.ts`     | 3 leyes de ejemplo: Protección de Datos, Propiedad Intelectual, Seguridad Laboral. |
| `empleadosDemo` (default) | `fixtures/empleadosBase.ts` | 3 empleados de ejemplo (fijo, por hora y vendedor).                                |
| `empresaDemo` (named)     | `fixtures/empleadosBase.ts` | Empresa usada por los empleados de ejemplo.                                        |
