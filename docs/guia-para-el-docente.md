# Mercuria — Guía del sistema para el docente

Este documento explica **todo el sistema** de punta a punta, pensado para un docente de
programación que quiera entender qué se construyó, cómo se cumple la consigna original y
qué conceptos se ponen en juego. No hace falta leer los otros documentos: acá está el
recorrido completo, con el código real y referencias a los archivos.

> Nombre del proyecto: **Mercuria**. Nace como el ejercicio clásico de **polimorfismo**
> (sueldos de empleados) y crece hasta una pequeña simulación económica con naciones,
> leyes, empresas, IA y una UI web que se actualiza en vivo.

---

## 1. Resumen ejecutivo

- **Consigna base**: una clase `Empleado` con `calcularSueldo()`, tres subclases que la
  sobrescriben (`EmpleadoFijo`, `EmpleadoPorHora`, `Vendedor`), un array con empleados de
  distintos tipos y un recorrido que llama `calcularSueldo()` en cada uno.
- **Qué se entrega**: esa consigna **más** una capa de dominio (naciones/estados/leyes,
  propiedades, empresa, IA y agentes), un **modelo económico** simulado, una **API
  GraphQL**, una **UI web** en React, persistencia en **SQLite** y **tests**.
- **Lenguaje**: TypeScript en modo `strict`, ejecutado con **Bun** (sin paso de build).
- **Idea didáctica central**: mostrar cómo **una** decisión de diseño (el método
  polimórfico `calcularSueldo()`) escala a un sistema grande sin llenar el código de
  `if`/`switch` por tipo.

---

## 2. La consigna original y cómo se cumple

La consigna está en [`requirements.md`](../requirements.md) y el checklist en
[`roadmap.md`](./roadmap.md). Cada punto tiene su lugar en el código:

| Requerimiento                                                       | Dónde vive                                                        |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Clase `Empleado` con `calcularSueldo()`                             | [`src/domain/Empleado.ts`](../src/domain/Empleado.ts)             |
| `EmpleadoFijo`: sueldo mensual de $50.000                          | [`src/domain/EmpleadoFijo.ts`](../src/domain/EmpleadoFijo.ts)     |
| `EmpleadoPorHora`: horas × tarifa                                   | [`src/domain/EmpleadoPorHora.ts`](../src/domain/EmpleadoPorHora.ts) |
| `Vendedor`: sueldo base + comisión por ventas                       | [`src/domain/Vendedor.ts`](../src/domain/Vendedor.ts)             |
| Tres subclases que **heredan** de `Empleado`                        | los tres archivos de arriba (`extends Empleado`)                  |
| **Sobrescribir** `calcularSueldo()` en cada subclase                | `override calcularSueldo()` en cada una                           |
| Varios empleados de distintos tipos en un **mismo array**           | [`tests/dominio.test.ts`](../tests/dominio.test.ts), test "el mismo array mezcla tipos…" |
| **Recorrer** el array y ejecutar `calcularSueldo()`                | [`src/services/nomina.ts`](../src/services/nomina.ts) (`calcularNomina`) |

El requisito de "recorrer el array" está implementado como un **servicio**, no como un
bucle suelto en el `main`: eso permite reutilizarlo desde la CLI, la API y los tests.

---

## 3. Los conceptos de POO que demuestra el sistema

### 3.1 Clase, estado y comportamiento (encapsulación)

Cada entidad es una clase que **guarda su estado y sabe operar con él**. `Persona` es la
base de las personas:

```ts
// src/domain/Persona.ts (resumido)
class Persona {
  nombre: string;
  edad: number;
  // ...
}
export default Persona;
```

`Empleado` **hereda** de `Persona` y agrega lo suyo (sueldo, id, empresa):

```ts
// src/domain/Empleado.ts
class Empleado extends Persona {
  sueldo: number;
  id: number;
  empresa: Empresa;

  constructor(sueldo: number, nombre: string, id: number, empresa: Empresa) {
    super(nombre, 0, "", new Date(), "", "", true);
    // ...
  }

  calcularSueldo(): number {
    return this.sueldo; // regla por defecto; las subclases la pisan
  }

  tipoSueldo(): TipoSueldo {
    return "fijo";
  }
}
```

### 3.2 Herencia

Hay **cinco** jerarquías de herencia en el dominio. Esto es útil para mostrar que la
herencia no es solo para el ejemplo de sueldos:

```
Persona
└── Empleado
    ├── EmpleadoFijo      ($50.000 fijo)
    ├── EmpleadoPorHora   (horas × tarifa)
    ├── Vendedor          (base + comisión)
    └── Jefe              (tiene un equipo a cargo)

Nacion
└── Estado               (hereda y cambia la prioridad de leyes)

Ley
└── LeyEstatal           (fuerza alcance "estado")

AI
└── Agente               (hereda y agrega sector/productividad)
```

### 3.3 Polimorfismo (el corazón del trabajo)

El polimorfismo acá tiene **tres formas**, todas apoyadas en el mismo principio: *el
objeto sabe cómo responder, el que lo usa no pregunta de qué tipo es*.

**a) `calcularSueldo()`.** Cada subclase da su propia fórmula:

```ts
// EmpleadoFijo
override calcularSueldo(): number { return SUELDO_MENSUAL; }        // 50.000

// EmpleadoPorHora
override calcularSueldo(): number {
  return this.horasTrabajadas * this.tarifaPorHora;
}

// Vendedor
override calcularSueldo(): number {
  return this.sueldo + this.ventas * (this.porcentajeComision / 100);
}
```

El consumo es **un solo bucle** sobre un array heterogéneo, sin `if` por tipo:

```ts
// src/services/nomina.ts
function calcularNomina(empleados: Empleado[], ...): LineaNomina[] {
  return empleados.map((empleado) => {
    const base = empleado.calcularSueldo();          // dispatch dinámico
    const final = empleado.sueldoConLeyes(...);
    return { /* ... */ };
  });
}
```

El test lo confirma con un array de tres tipos distintos:

```ts
// tests/dominio.test.ts
const empleados = [
  new EmpleadoFijo("Ana", 1, empresa),
  new EmpleadoPorHora("Beto", 2, empresa, 10, 100),
  new Vendedor("Carla", 3, empresa, 1000, 1000, 10),
];
expect(empleados.map((e) => e.calcularSueldo())).toEqual([50000, 1000, 1100]);
```

**b) `tipoSueldo()`.** `Empleado` responde `"fijo"`; `EmpleadoPorHora` y `Vendedor` lo
sobrescriben a `"variable"`. Es polimorfismo de **una sola línea** que la UI aprovecha
para etiquetar cada línea de nómina.

**c) `factorLeyes(objetivo)`.** La misma idea, pero sobre leyes:

- `Nacion` suma las leyes activas de su territorio.
- `Estado` **sobrescribe** y decide: si tiene leyes estatales activas, mandan esas; si no,
  **hereda** el factor de la nación.

```ts
// src/domain/Estado.ts
override factorLeyes(objetivo: ObjetivoLey): number {
  const propias = this.leyesEstatalesDe(objetivo);
  if (propias.length > 0) {
    return propias.reduce((factor, ley) => factor + ley.factor(), 0);
  }
  return this.nacion.factorLeyes(objetivo); // herencia de comportamiento
}
```

`Empresa.factorLeyes()` usa esa interfaz sin saber si detrás hay una `Nacion` o un
`Estado`: **programa contra el contrato, no contra la clase concreta**.

### 3.4 Abstracción en capas

El dominio **no conoce** la API ni la base de datos. Los servicios orquestan al dominio
(por ejemplo `calcularNomina`), y el servidor traduce a **DTOs** JSON. La UI (React) no
importa código del backend: consume GraphQL por HTTP. Ver §4.

### 3.5 Composición sobre herencia

Además de heredar, las entidades se **componen**: una `Empresa` **tiene** empleados,
propiedades, un jefe y opcionalmente una `AI`; una `AI` **tiene** agentes y empresas
adquiridas. `Jefe.costoEquipo()` y `Empresa.nominaTotal()` recorren la composición
reutilizando `calcularSueldo()`.

### 3.6 Polimorfismo en la persistencia (`instanceof`)

El informe de nómina se guarda en SQLite como filas planas (`tipo`, `sueldo`, `datos`
JSON). Al **reconstruir**, el servidor usa `instanceof`/`switch` sobre el tipo guardado
para instanciar la subclase correcta:

```ts
// src/server/mundo.ts → reconstruirEmpleado
switch (fila.tipo) {
  case "EmpleadoPorHora": return new EmpleadoPorHora(...);
  case "Vendedor":        return new Vendedor(...);
  case "Jefe":            return new Jefe(...);
  default:                return new EmpleadoFijo(...);
}
```

Es un buen punto de discusión: la capa de infraestructura **sí** necesita conocer los
tipos concretos para deserializar; el dominio, en cambio, solo ve `Empleado`.

---

## 4. Arquitectura por capas

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  web/  (React 19 + Vite)    │        │  src/cli.ts  (consola)       │
│  UI y navegador             │        └───────────────┬──────────────┘
└──────────────┬──────────────┘                        │
               │ HTTP (GraphQL + SSE)                   │
               ▼                                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  src/server/   (Elysia + graphql-yoga + SQLite)                       │
│  index → app → schema/mundo → reloj/eventos → db                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  src/services/  (casos de uso: nómina, leyes, naciones, simulación,   │
│                  predicción)                                          │
└──────────────────────────────┬───────────────────────────────────────┘
                               │  + fixtures/ (datos de ejemplo)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  src/domain/    (clases del modelo: Persona, Empleado, Empresa,       │
│                  Nacion, Estado, Ley, Propiedad, AI, Agente, ...)     │
└──────────────────────────────────────────────────────────────────────┘
```

**Regla de dependencia** (dirección de los imports):

```
entrypoints (index/cli/server) ──► services ──► domain
                                        fixtures ──► domain
web ──(solo HTTP)──► servidor            domain NO importa de services/fixtures/server
```

- `domain/` es el núcleo: **no** sabe nada de las otras capas.
- `services/` y `fixtures/` pueden usar `domain/`.
- `server/` usa `fixtures/` y `services/`, nunca al revés.
- `web/` no importa backend: sus tipos (`web/src/types.ts`) son **espejo** de los DTOs.

En TypeScript esto se refuerza con `import type` (obligatorio por `verbatimModuleSyntax`),
que evita ciclos de runtime como `Nacion ↔ Ley` o `AI ↔ Agente`.

### Árbol de carpetas

```
polimorfismo/
├── src/
│   ├── domain/        Clases del modelo (una clase por archivo)
│   ├── services/      Casos de uso (nomina, leyes, naciones, simulacion, prediccion)
│   ├── fixtures/      Datos semilla (naciones, leyes, empleados, empresas, ...)
│   ├── server/        API HTTP: app, schema (GraphQL), mundo (DTOs), reloj, eventos, db
│   ├── cli.ts         CLI interactiva
│   └── index.ts       Punto de entrada
├── web/               Frontend React (workspace de Bun)
├── tests/             Tests del dominio (bun test)
├── docs/              Esta documentación
├── requirements.md    Consigna original
└── package.json / tsconfig.json
```

---

## 5. Recorrido de una operación

### 5.1 Por CLI (el camino corto)

```
bun run start
  → src/index.ts  → src/cli.ts
      → new EmpleadoFijo / EmpleadoPorHora / Vendedor
      → services/nomina.ts → calcularNomina(empleados, leyesGlobales, productividad)
          → empleado.calcularSueldo()      (polimorfismo)
          → empleado.sueldoConLeyes(...)   (base × leyes × productividad)
      → imprime la nómina con totales
```

### 5.2 Por web (el camino largo)

```
Navegador (React)
  → GET /api/stream (SSE): recibe el Mundo completo y se actualiza solo
  → POST /graphql: queries (mundo, economia, nomina, ...) y mutations
        → src/server/schema.ts (resolvers)
            → src/server/mundo.ts (estado del mundo + DTOs)
                → src/services/simulacion.ts (avanzar)
                    → src/domain/* (Empresa, Economia, Mercado, ...)
        → persistir() → SQLite + publicar() al bus de eventos
            → SSE empuja el mundo nuevo a todos los clientes
```

---

## 6. El dominio extendido (extras)

Además de la consigna, el modelo agrega:

- **Naciones** (`Nacion`): nombre, iniciales, capital, idioma, población y **leyes**.
- **Estados** (`Estado extends Nacion`): división con leyes propias (`LeyEstatal`) y
  **prioridad**: si tiene leyes activas, mandan; si no, hereda la nación.
- **Leyes** (`Ley`): nombre, descripción, `efecto` (positivo/negativo), `magnitud`,
  `objetivo` (`sueldo | empresa | propiedad | ai`) y `alcance`
  (`nacion | estado | global`). Las globales aplican a todas las naciones.
- **Propiedades** (`Propiedad`): precio, ubicación fiscal (estado o nación), dueño; se
  compran y venden, y el precio se ajusta por leyes.
- **Empresa** (`Empresa`): capital, empleados, propiedades, jefe, IA; jerarquía
  (jefe → equipo) y aplicación de leyes (`factorLeyes`).
- **IA** (`AI`) y **Agentes** (`Agente extends AI`): la IA es una "entidad total" que nace
  de una empresa (`empresaMatriz`), tiene sueldo afectado por leyes objetivo `"ai"` y
  agentes por sector con un `costoUso()` según modelo y productividad. Toda AI **exige**
  una empresa matriz (validado en el constructor, con test).
- **Identificadores** (`identificadores.ts`): ids con formato legible, por ejemplo
  `US-2026-10-06-k3f9a1` (ley), `US-CA-2026-10-06-9kqf5q` (ley estatal), `CL-k3f9a1` (IA).

El sueldo final combina todo:

```
sueldoFinal = sueldoBase × (1 + factorLeyes) × productividadGlobal
```

donde `factorLeyes` sale de la **empresa** (que a su vez resuelve estado/nación) más las
leyes globales. Ahí se ve el polimorfismo de `factorLeyes` en acción.

---

## 7. El modelo económico

Sobre el dominio anterior corre un ciclo de simulación
([`src/services/simulacion.ts`](../src/services/simulacion.ts)). Un **período**:

1. Cada empresa produce: `capital × productividad × factorRecursos × (1 − impacto ambiental)`.
2. Se consumen recursos y se emiten contaminantes.
3. Se actualizan recursos (consumo, regeneración, precio por escasez).
4. La productividad de cada empresa **converge** al techo que impone su entorno.
5. Se recalcula la **productividad global** (promedio ponderado por capital) y el **PIB**.
6. El **mercado** repercute los precios de las acciones.
7. Se guarda un punto en el histórico y sube el `periodo`.

Piezas: `Economia` (PIB, productividad global, histórico), `Recurso`
(agua/electricidad/combustible/minerales), `Ambiente` (contaminación, aire, temperatura),
`Accion` y `Mercado` (cotización, capitalización, adquisiciones con prima del 20 %).
El detalle y las fórmulas están en [`economia.md`](./economia.md).

Lo importante para el docente: **la productividad global es el puente** entre la
economía y el ejercicio de polimorfismo — multiplica el sueldo de *todos* los empleados
sin cambiar ni una subclase.

---

## 8. Simulación en vivo, predicción y usuarios

- **Reloj en el servidor** ([`src/server/reloj.ts`](../src/server/reloj.ts)): play/pausa,
  velocidad y períodos por tick. **Arranca solo** al levantar el proceso (economía
  autónoma, aunque no haya nadie conectado). Cadencia por `POLIMORFISMO_TICK_MS`
  (default 30 s); se puede apagar con `POLIMORFISMO_SIM_AUTOSTART=0`.
- **Bus de eventos + SSE** ([`eventos.ts`](../src/server/eventos.ts),
  [`app.ts`](../src/server/app.ts)): cada tick o mutación publica el `Mundo` completo por
  `GET /api/stream`; la UI lo recibe con `EventSource` y se refresca sin recargar.
- **Predicción aislada** ([`src/services/prediccion.ts`](../src/services/prediccion.ts)):
  clona el mundo (recursos, ambiente, empresas, mercado) y corre N períodos sobre la
  copia. **No toca el estado real**: sirve para ver a dónde lleva la configuración actual.
  Es un excelente ejemplo de *clonado profundo* y de por qué conviene separar el estado
  mutable.
- **Usuarios** ([`domain/Usuario.ts`](../src/domain/Usuario.ts)): registro con `handle` +
  `PIN` (hash con `Bun.password`, nunca en claro) y sesiones por token. Cada usuario puede
  **fundar** empresas y **adquirir** las del sistema, y recibe un **resumen de ausencia**
  (variación de métricas + eventos) al volver.

---

## 9. Cómo ejecutarlo

Requiere [Bun](https://bun.sh).

```bash
bun install

# Ejercicio mínimo (polimorfismo)
bun run demo      # nómina de ejemplo, sin interacción
bun run start     # CLI interactiva (crear empleados, ver nómina, ...)

# Sistema completo (API + UI)
bun run serve     # API + UI en http://localhost:3011/  (GraphQL en /graphql)
bun run web:dev   # UI en modo dev (:3010, proxy a :3011)
bun run web:build # genera web/dist, que `serve` sirve en la raíz

# Calidad
bun test          # tests del dominio, simulación, predicción y usuarios
bun run check     # chequeo de tipos (tsc --noEmit)
bun run lint      # oxlint
bun run format    # oxfmt
```

Variables de entorno útiles: `PORT`/`HOST`, `POLIMORFISMO_DB` (ruta de SQLite, default
`data/mundo.db`), `POLIMORFISMO_TICK_MS`, `POLIMORFISMO_SIM_AUTOSTART`.

> La API y la UI comparten un solo puerto: `/` sirve la UI (si hay `web/dist`) y `/graphql`
> la API con GraphiQL.

---

## 10. Tests: qué garantizan

Están escritos con `bun test` y cubren el comportamiento, no la implementación:

| Archivo                                                  | Qué verifica                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`tests/dominio.test.ts`](../tests/dominio.test.ts)       | Sueldos polimórficos, leyes (positivas, inactivas, prioridad estado/nación, globales), propiedades, jerarquía de empresa, IA y agentes. |
| [`tests/simulacion.test.ts`](../tests/simulacion.test.ts) | El ciclo económico y que 60 períodos no colapsan el sistema.             |
| [`tests/prediccion.test.ts`](../tests/prediccion.test.ts) | Que `predecir()` **no** modifica el estado real y que el bus de eventos funciona. |
| [`tests/usuario.test.ts`](../tests/usuario.test.ts)       | Registro/login, hash de PIN y empresas de usuario.                       |

El test de polimorfismo más ilustrativo es el del array heterogéneo
(`[50000, 1000, 1100]`), porque prueba exactamente la consigna original.

---

## 11. Sugerencia de rúbrica / qué mirar

1. **Polimorfismo real**: ¿el array heterogéneo se recorre sin `if`/`switch` por tipo?
   (Sí: `services/nomina.ts`.)
2. **Herencia correcta**: `override`, llamada a `super(...)`, subclases que solo cambian lo
   que deben.
3. **Separación de capas**: ¿el dominio ignora HTTP y SQLite? ¿la UI ignora el backend?
4. **Coherencia del modelo**: la IA exige empresa matriz; el estado prioriza sus leyes;
   las leyes globales no se cuentan dos veces.
5. **Testabilidad**: cada regla de negocio tiene su test.
6. **Documentación**: hay guía de dominio, economía, API y organización.
7. **Puntos de discusión honestos**: la capa de persistencia **sí** conoce los tipos
   concretos (`instanceof`/`switch`) para deserializar; el mercado **no** tiene libro de
   órdenes real (el precio lo fija una fórmula); no hay inflación ni quiebras. Todo eso
   está declarado en [`economia.md`](./economia.md#límites-y-escalado).

---

## 12. Mapa de archivos clave

| Archivo                                                   | Rol                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| [`src/domain/Empleado.ts`](../src/domain/Empleado.ts)      | Clase base del polimorfismo de sueldos.                     |
| [`src/domain/EmpleadoFijo.ts`](../src/domain/EmpleadoFijo.ts)       | `$50.000` mensual.                              |
| [`src/domain/EmpleadoPorHora.ts`](../src/domain/EmpleadoPorHora.ts) | Horas × tarifa.                                 |
| [`src/domain/Vendedor.ts`](../src/domain/Vendedor.ts)      | Base + comisión.                                            |
| [`src/domain/Empresa.ts`](../src/domain/Empresa.ts)        | Composición, jerarquía y leyes.                             |
| [`src/domain/Nacion.ts`](../src/domain/Nacion.ts) / [`Estado.ts`](../src/domain/Estado.ts) / [`Ley.ts`](../src/domain/Ley.ts) / [`LeyEstatal.ts`](../src/domain/LeyEstatal.ts) | Territorio y leyes. |
| [`src/domain/AI.ts`](../src/domain/AI.ts) / [`Agente.ts`](../src/domain/Agente.ts) | IA y sus agentes.                          |
| [`src/services/nomina.ts`](../src/services/nomina.ts)      | Recorre el array y calcula (consigna central).              |
| [`src/services/simulacion.ts`](../src/services/simulacion.ts) | Ciclo económico por período.                             |
| [`src/services/prediccion.ts`](../src/services/prediccion.ts) | Proyección sobre una copia aislada.                      |
| [`src/server/schema.ts`](../src/server/schema.ts)          | Esquema GraphQL (queries y mutations).                      |
| [`src/server/mundo.ts`](../src/server/mundo.ts)            | Estado del mundo, DTOs y acciones.                          |
| [`src/server/reloj.ts`](../src/server/reloj.ts) / [`eventos.ts`](../src/server/eventos.ts) | Simulación en vivo y SSE.         |
| [`web/src/App.tsx`](../web/src/App.tsx)                    | Shell de la UI y navegación por pestañas.                   |
| [`tests/dominio.test.ts`](../tests/dominio.test.ts)        | Pruebas del dominio (empezar acá para leer).                |

---

## 13. Límites declarados (para no vender humo)

Simplificaciones **deliberadas**, pensadas para que el trabajo sea navegable y no un
motor financiero de producción:

- El mercado **no** tiene libro de órdenes ni liquidez real; el precio lo mueve una fórmula.
- El PIB es nominal: no hay inflación, tasas ni banco central.
- Sin quiebras ni desempolques automáticos; una empresa con capital negativo no desaparece.
- Las leyes afectan sueldos, propiedades e IA, pero no el PIB ni los recursos.
- Los recursos son independientes entre sí (no hay sustitución).

El orden razonable de crecimiento (libro de órdenes → inflación/tasas → leyes sobre el PIB
→ quiebras → eventos exógenos) está en
[`economia.md`](./economia.md#límites-y-escalado).

---

## 14. Cómo leer el código (ruta sugerida)

1. `requirements.md` — la consigna.
2. `src/domain/Persona.ts` → `Empleado.ts` → las tres subclases.
3. `src/services/nomina.ts` — el recorrido polimórfico.
4. `tests/dominio.test.ts` — las reglas, ejecutables.
5. `src/domain/Empresa.ts`, `Nacion.ts`, `Estado.ts`, `Ley.ts` — los extras.
6. `src/domain/AI.ts` y `Agente.ts` — IA y agentes.
7. `src/services/simulacion.ts` y `prediccion.ts` — la economía.
8. `src/server/schema.ts` y `mundo.ts` — cómo se expone todo por GraphQL.
9. `web/src/App.tsx` y `views/` — la UI.

Con esa secuencia se entiende el sistema de punta a punta sin leer nada de más.
