# Modelo de dominio

Descripción de las clases que viven en `src/domain/`, con sus campos reales tal como
están en el código hoy. Todas las clases están **implementadas**.

## Núcleo

### Persona — `domain/Persona.ts`

Clase base de las personas.

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

Hereda de `Persona`.

- Campos propios: `sueldo: number`, `id: number`, `empresa: Empresa`.
- `calcularSueldo(): number` devuelve el sueldo base; las subclases lo sobrescriben.
- `tipoSueldo(): "fijo" | "variable"` — las subclases variables lo sobrescriben.
- `sueldoDetallado(): Sueldo` — el sueldo base como objeto de dominio.
- `sueldoConLeyes(leyesGlobales?): Sueldo` — aplica las leyes de la empresa
  (`empresa.factorLeyes("sueldo")`) más las globales.

### Subclases de Empleado

| Clase             | Archivo                     | Regla de `calcularSueldo()`                  | `tipoSueldo` |
| ----------------- | --------------------------- | -------------------------------------------- | ------------ |
| `EmpleadoFijo`    | `domain/EmpleadoFijo.ts`    | `$50.000` mensual (`SUELDO_MENSUAL`).        | `fijo`       |
| `EmpleadoPorHora` | `domain/EmpleadoPorHora.ts` | `horasTrabajadas × tarifaPorHora`.           | `variable`   |
| `Vendedor`        | `domain/Vendedor.ts`        | `sueldo base + ventas × (comisión % / 100)`. | `variable`   |

### Jefe — `domain/Jefe.ts`

Hereda de `Empleado`.

- Campos propios: `departamento: string`, `equipo: Empleado[]`.
- `supervisar(empleado)` / `desvincular(empleado)`: mantiene el equipo a cargo.
- `costoEquipo(): number`: suma de los sueldos base del equipo.

### Empresa — `domain/Empresa.ts`

Entidad legal que agrupa empleados y propiedades.

- Campos: `nombre`, `id`, `empleados: Empleado[]`, `capital`, `propiedades: Propiedad[]`,
  `nacion?`, `estado?`, `jefe?`, `ai?`.
- `factorLeyes(objetivo, leyesGlobales?)`: leyes del estado (o nación) + globales.
- `contratar`, `despedir`, `designarJefe`, `nominaTotal`.
- `puedeAdquirir(limite)`, `comprarPropiedad(propiedad)`, `venderPropiedad(propiedad)`.
- `crearAI(nombre, modelo, sueldoBase)` / `vincularAI(ai)`.

### Sueldo — `domain/Sueldo.ts`

Representa una remuneración.

- Campos: `monto: number`, `deduce: boolean`, `tipo: "fijo" | "variable"`.
- `conLeyes(factor): Sueldo` — devuelve un nuevo sueldo con el factor aplicado
  (0.1 = +10%), redondeado a centavos.

## Naciones, estados y leyes

### Ley — `domain/Ley.ts`

- Campos: `nombre`, `id`, `descripcion`, `afecta: Nacion[]`, `activa`,
  `efecto: "positivo" | "negativo"`, `magnitud: number`, `objetivo`, `alcance`,
  `limite?`.
- **`objetivo`** (`ObjetivoLey`): `"sueldo" | "empresa" | "propiedad" | "ai"`.
- **`alcance`** (`AlcanceLey`): `"nacion" | "estado" | "global"`. Las leyes globales no
  se registran en ninguna nación (aplican a todas) y se resuelven con
  `factorLeyesGlobales(leyes, objetivo)`.
- `factor()`: `+magnitud` si el efecto es positivo, `-magnitud` si es negativo.
- `aplicaA(nacion)`, `activar()`, `desactivar()`.
- El `id` usa las iniciales de la nación: `<Nacion iniciales>-<fecha>-<id>`.

### Nacion — `domain/Nacion.ts`

- Campos: `nombre`, `id`, `iniciales`, `capital`, `idioma`, `poblacion`, `leyes: Ley[]`.
- `registrarLey(ley)`, `leyesDe(objetivo)`, `factorLeyes(objetivo)`.

### Estado — `domain/Estado.ts`

Hereda de `Nacion`.

- Campos propios: `override leyes: LeyEstatal[]`, `nacion: Nacion`.
- **Prioridad de leyes**: si el estado tiene leyes activas para el objetivo, mandan las
  del estado; si no, se hereda el factor de la nación.
- El `id` usa las iniciales de su nación: `<Nacion iniciales>-<id>`.

### LeyEstatal — `domain/LeyEstatal.ts`

Hereda de `Ley`.

- Campo propio: `estado: Estado[]`. El constructor fuerza `alcance: "estado"`.
- El `id` combina iniciales de nación y estado:
  `<Nacion iniciales>-<Estado iniciales>-<fecha>-<id>`.

## Propiedades

### Propiedad — `domain/Propiedad.ts`

- Campos: `nombre`, `id`, `precio`, `nacion`, `estado?`, `dueño: Persona | Empresa | null`.
- `ubicacionFiscal`: el estado si lo hay, si no la nación.
- `precioConLeyes(leyesGlobales?)`: precio ajustado por las leyes del lugar.
- `vender(nuevoDueño)`: cambia el título (la parte económica la maneja la empresa).

## AI y agentes

### AI — `domain/AI.ts`

- Campos: `nombre`, `modelo`, `id`, `empresaMatriz: Empresa`, `sueldoBase`, `asi`,
  `rogue`, `agentes: Agente[]`, `propiedades: Propiedad[]`, `empleados: Empleado[]`,
  `empresas: Empresa[]`.
- El constructor **exige** una empresa matriz (toda AI nace de una empresa).
- `sueldoConLeyes(leyesGlobales?)`: sueldo afectado por las leyes (objetivo `"ai"`).
- `agentesDeSector(sector)`.
- El `id` usa las iniciales del modelo: `<Modelo iniciales>-<id>`.

### Agente — `domain/Agente.ts`

Hereda de `AI`.

- Campos propios: `aiMatriz: AI`, `sector: string`, `productividad: number`.
- Al crearse hereda la `empresaMatriz` de su AI matriz y queda registrado en
  `aiMatriz.agentes`.
- `costoUso()`: `costoModelo(modelo) × productividad`. `costoModelo` matchea por
  subcadena (`"Claude 3.5"` → `claude`).

## Identificadores

Utilidades en `domain/identificadores.ts`:

- `iniciales(texto)`: varias palabras → primera letra de cada una (`"United States"` →
  `US`); una sola palabra → sus dos primeras letras (`"Claude"` → `CL`).
- `fechaId(fecha?)`: `YYYY-MM-DD`.
- `idAleatorio(largo?)`: sufijo aleatorio base 36.

| Entidad     | Formato                                              | Ejemplo                   |
| ----------- | ---------------------------------------------------- | ------------------------- |
| Estado      | `<Nacion iniciales>-<id>`                            | `US-vkvguk`               |
| Ley         | `<Nacion iniciales>-<fecha>-<id>`                    | `US-2026-10-06-6pcm30`    |
| LeyEstatal  | `<Nacion iniciales>-<Estado iniciales>-<fecha>-<id>` | `US-CA-2026-10-06-9kqf5q` |
| Propiedad   | `<Nacion iniciales>-PROP-<id>`                       | `US-PROP-3f9a1c`          |
| AI / Agente | `<Modelo iniciales>-<id>`                            | `CL-jel9nm`               |

## Modelo económico

Estas clases viven también en `domain/`; su interacción y fórmulas están documentadas en
[economia.md](economia.md).

| Clase      | Archivo              | Rol                                                                  |
| ---------- | -------------------- | -------------------------------------------------------------------- |
| `Recurso`  | `domain/Recurso.ts`  | Agua, electricidad, combustible, minerales: disponibilidad y precio. |
| `Ambiente` | `domain/Ambiente.ts` | Contaminación, calidad de aire, temperatura, biodiversidad.          |
| `Economia` | `domain/Economia.ts` | PIB global, productividad global, período e histórico.               |
| `Accion`   | `domain/Accion.ts`   | Cotización: precio, acciones, capitalización, variación, índice.     |
| `Mercado`  | `domain/Mercado.ts`  | Cotizaciones, índice, costo de adquisición y compra de empresas.     |

Cambios en clases ya documentadas: `Empresa` sumó `productividad`, `capacidad`, `acciones`,
`intensidadEmision`, `subsidiarias` y `controladaPor`; `AI` sumó `productividad` y
`adquirir()`; `Empleado.sueldoConLeyes()` ahora recibe la productividad global; `Sueldo`
sumó `escalar()`.

## Servicios — `src/services/`

| Función                                       | Archivo       | Descripción                                              |
| --------------------------------------------- | ------------- | -------------------------------------------------------- |
| `calcularNomina(empleados, leyes?)`           | `nomina.ts`   | Sueldo base, factor de leyes y sueldo final de cada uno. |
| `totalNomina(empleados)`                      | `nomina.ts`   | Suma de los sueldos base.                                |
| `totalNominaFinal(empleados, leyes?)`         | `nomina.ts`   | Suma de los sueldos finales.                             |
| `formatearMoneda(monto)`                      | `nomina.ts`   | Formatea en es-AR.                                       |
| `imprimirNomina(empleados, leyes?)`           | `nomina.ts`   | Imprime la nómina con totales.                           |
| `factorTotal(ubicacion, objetivo, globales?)` | `leyes.ts`    | Factor de leyes de una ubicación + globales.             |
| `leyesActivas(leyes, objetivo?)`              | `leyes.ts`    | Filtra leyes activas por objetivo.                       |
| `resumenLeyes(leyes)`                         | `leyes.ts`    | Cantidad y factor total por objetivo.                    |
| `listarNaciones(naciones)`                    | `naciones.ts` | Imprime por consola y devuelve las naciones.             |
| `obtenerNaciones(naciones)`                   | `naciones.ts` | Versión que delega en `listarNaciones`.                  |
| `predecir(mundo, periodos)`                   | `prediccion.ts` | Proyección aislada: clona el mundo y corre N períodos. |
| `clonarMundo(mundo)`                          | `prediccion.ts` | Copia independiente de economía, empresas y mercado.  |

## CLI — `src/cli.ts`

CLI interactiva (`bun run start`): cargar la nómina de ejemplo, crear empleados (fijo, por
hora o vendedor), ver la nómina (con leyes), vaciarla y ver la empresa demo. Con `--demo`
(`bun run demo`) imprime la nómina de ejemplo sin interacción.

## Servidor — `src/server/`

| Módulo       | Rol                                                                             |
| ------------ | ------------------------------------------------------------------------------- |
| `index.ts`   | Arranque del servidor (`listen`).                                               |
| `app.ts`     | Rutas: GraphQL (`/graphql`), salud (`/api/salud`) y stream SSE (`/api/stream`). |
| `schema.ts`  | Esquema GraphQL (typeDefs + resolvers).                                         |
| `mundo.ts`   | Estado del mundo, DTOs y acciones; publica cambios al bus.                      |
| `db.ts`      | Persistencia SQLite (`bun:sqlite`).                                             |
| `reloj.ts`   | Reloj en vivo: play/pausa, velocidad, períodos/tick.                            |
| `eventos.ts` | Bus de eventos (`suscribir` / `publicar`) que alimenta el SSE.                  |

## Datos de prueba — `src/fixtures/`

| Export                                | Archivo              | Contenido                                                |
| ------------------------------------- | -------------------- | -------------------------------------------------------- |
| `nacionPrincipal`, `nacionSecundaria` | `nacionesBase.ts`    | United States y Uruguay.                                 |
| `california`, `montevideo`            | `estadosBase.ts`     | Estados de cada nación.                                  |
| `leyes` (default)                     | `leyesBase.ts`       | 6 leyes nacionales/estatales + 1 global, ya registradas. |
| `leyesGlobales` (named)               | `leyesBase.ts`       | Solo la ley de alcance global.                           |
| `empleadosDemo` (default)             | `empleadosBase.ts`   | 4 empleados (fijo, por hora, vendedor y jefe).           |
| `empresaDemo` (named)                 | `empleadosBase.ts`   | Empresa Demo (nación US, estado California) con su jefe. |
| `propiedades` (default)               | `propiedadesBase.ts` | 4 propiedades (una ya de Ana Fija).                      |
| `agentesDemo` (default)               | `aiBase.ts`          | 3 agentes de la IA Orion (soporte, ventas, datos).       |
| `aiCentral` (named)                   | `aiBase.ts`          | La IA de la Empresa Demo.                                |
