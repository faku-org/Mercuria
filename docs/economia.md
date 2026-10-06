# Sistema económico y simulación

Este documento define el modelo económico: **productividad**, **PIB global**,
**mercado de acciones**, **adquisiciones entre empresas** (que las IAs usan) y
**recursos / ambiente**. También describe cómo avanza la simulación período a período.

> Alcance consciente: esto escala rápido. Acá queda **documentado qué es deliberadamente
> simple** y qué habría que cambiar para ir a algo serio (ver [Límites y escalado](#límites-y-escalado)).

## Piezas del modelo

```
                    ┌──────────────┐
                    │   Economia   │  pibGlobal, productividadGlobal, periodo, histórico
                    └──────┬───────┘
             usa           │           usa
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
 ┌─────────┐         ┌──────────┐         ┌───────────┐
 │ Recurso │         │ Ambiente │         │  Mercado  │
 │ agua,   │         │ contam., │         │ cotizac., │
 │ luz...  │         │ calidad  │         │ market cap│
 └────┬────┘         └────┬─────┘         └─────┬─────┘
      │ factor             │ impacto             │ precio
      └────────┬───────────┴─────────────────────┘
               ▼
          ┌─────────┐  productividad, capital, aportePib
          │ Empresa │◄──── controladaPor / subsidiarias (M&A)
          └────┬────┘
               │ empleados
               ▼
          ┌──────────┐  sueldo = base × (1 + leyes) × productividadGlobal
          │ Empleado │
          └──────────┘
```

| Entidad    | Archivo              | Rol                                                                  |
| ---------- | -------------------- | -------------------------------------------------------------------- |
| `Recurso`  | `domain/Recurso.ts`  | Agua, electricidad, combustible, minerales: disponibilidad y precio. |
| `Ambiente` | `domain/Ambiente.ts` | Contaminación, calidad de aire, temperatura, biodiversidad.          |
| `Economia` | `domain/Economia.ts` | PIB global, productividad global, período e histórico.               |
| `Accion`   | `domain/Accion.ts`   | Cotización de una empresa: precio, acciones, capitalización.         |
| `Mercado`  | `domain/Mercado.ts`  | Lista de cotizaciones, reprecio y adquisiciones.                     |
| `Empresa`  | `domain/Empresa.ts`  | Suma `productividad`, `acciones`, `subsidiarias`, `controladaPor`.   |
| `Empleado` | `domain/Empleado.ts` | Su sueldo se multiplica por la productividad global.                 |
| `AI`       | `domain/AI.ts`       | Puede adquirir empresas a través del mercado.                        |

## Productividad

Dos niveles, sin doble conteo:

- **`Empresa.productividad`** (0–2; 1 = base). Determina cuánto produce la empresa: es lo
  que mueve su aporte al PIB, su consumo de recursos y su cotización.
- **`Economia.productividadGlobal`**. Promedio ponderado por capital de la productividad
  de las empresas. **Es el que escala los sueldos de todos** (efecto global).

```
productividadGlobal = Σ(productividadᵢ × capitalᵢ) / Σ(capitalᵢ)
sueldoFinal         = base × (1 + factorLeyes) × productividadGlobal
```

La empresa también puede bajar su productividad por escasez de recursos o contaminación
(ver el paso 4 del ciclo). La IA tiene `productividad` propia igual que una empresa.

## PIB y aporte de cada empresa

```
factorRecursos = Π (disponibilidadᵣ)^0.5     sobre los recursos que la empresa usa
aportePib      = capital × productividad × factorRecursos × (1 − ambiente.impacto())
pibGlobal      = Σ aportePib
crecimiento    = (pibGlobal − pibAnterior) / pibAnterior
```

`ambiente.impacto()` es un arrastre entre 0 y 1: contamina más y produce menos.

```
impacto = min(0.9, contaminacion × 0.5 + max(0, temperatura) × 0.1 + (1 − calidadAire) × 0.2)
temperatura = contaminacion × 2
```

## Recursos y ambiente

Cada recurso tiene `disponibilidad` (1 = nivel de referencia), `regeneracion` por período,
`consumoBase` (por unidad de producción) y `precio` (que sube con la escasez).

```
produccionᵢ     = capitalᵢ × productividadᵢ × factorRecursosᵢ × (1 − impacto)
consumoᵣ        = Σ (consumoBaseᵣ × produccionᵢ × 1e-9)
disponibilidadᵣ = clamp(disponibilidadᵣ − consumoᵣ + regeneracionᵣ, 0, 2)
precioᵣ         = precioBaseᵣ × (1 + 2 × escasezᵣ)      escasezᵣ = max(0, 1 − disponibilidadᵣ)
```

El factor `1e-9` (y `1.2e-10` en las emisiones) está en `services/simulacion.ts` y está
calibrado para que la disponibilidad se mueva de a poco en vez de vaciarse de golpe —
hay un test que corre 60 períodos y verifica que el sistema no colapsa.

El ambiente se degrada con las emisiones de la producción y se recupera muy lento:

```
contaminacion += Σ (produccionᵢ × intensidadEmisionᵢ) × 1.2e-10  (acotado a 1)
calidadAire    = clamp(1 − contaminacion, 0, 1)
contaminacion *= 0.995          # regeneración lenta por período
```

## Mercado

```
capitalizacion = precio × acciones
```

- La cotización sube/baja según el aporte al PIB y la variación de productividad:
  `precio *= 1 + 0.5 × crecimientoPib + 0.5 × Δproductividad`.
- **Adquisición**: un comprador (empresa o IA) paga una prima sobre la capitalización y
  toma el control de la empresa objetivo.

```
costoAdquisicion = capitalizacion × (1 + prima)      prima = 0.2
```

Al concretarse: el capital del comprador baja, la objetivo queda `controladaPor = comprador`
y el comprador la suma a `subsidiarias`. Las IAs usan esto para crecer sin contratar gente.

## Ciclo de simulación

`services/simulacion.ts` → `avanzarPeriodo(mundo)`, un período:

1. Cada empresa produce (capital × productividad × recursos × ambiente).
2. Se consumen recursos y se emiten contaminantes.
3. Se actualizan recursos (consumo, regeneración, precio por escasez).
4. La productividad de cada empresa **converge** al techo que el entorno permite:

   ```
   objetivo = 1.2 × capacidadᵢ × disponibilidadMedia × (1 − impacto)
   productividadᵢ += 0.15 × (objetivo − productividadᵢ)      acotada a [0, 2]
   ```

   `capacidad` es el techo estructural de la empresa (fixture: 1 / 1.4 / 0.85), así que
   las empresas no se homogeneizan: cada una tiende a su propia productividad ajustada
   por recursos y ambiente. Sin recursos ni aire limpio, todas caen.

5. Se recalcula `productividadGlobal` (ponderada por capital) y `pibGlobal`.
6. El mercado repercute precios.
7. Se agrega un `PuntoEconomico` al histórico y sube `periodo`.

El `mundo` guarda el histórico (`PuntoEconomico[]`) para que la UI pueda graficar.

```ts
interface PuntoEconomico {
  periodo: number;
  pib: number;
  productividadGlobal: number;
  contaminacion: number;
  indiceMercado: number; // media de precios normalizada
}
```

## Simulación en vivo

`avanzarPeriodo` es el mismo ciclo de arriba, pero un **reloj en el servidor**
(`src/server/reloj.ts`) puede correrlo solo: play/pausa, velocidad (intervalo entre ticks) y
períodos por tick. El reloj no escribe SQLite en cada cuadro (persiste cada 20 ticks y al
pausar); sí publica cada cambio en el bus de eventos (`src/server/eventos.ts`), que alimenta
el stream **SSE** `GET /api/stream`. De ahí que todos los clientes vean el mismo mundo en
vivo, sin refrescar y sin depender de un intervalo del navegador.

## Predicción (simulación aislada)

`predecir(periodos)` (`src/services/prediccion.ts`) **clona** recursos, ambiente, empresas y
mercado, y corre `avanzarPeriodos` sobre la copia. Devuelve las muestras `PuntoEconomico`
proyectadas sin tocar el estado real (período, histórico, productividades y cotizaciones
reales quedan intactos). Es una proyección determinista del modelo actual: sirve para ver a
dónde lleva la configuración vigente, no para anticipar shocks exógenos.

## Superficie GraphQL

La API es **GraphQL** (graphql-yoga sobre Elysia, endpoint `/graphql`, GraphiQL activo).

Queries principales:

| Query      | Devuelve                                                         |
| ---------- | ---------------------------------------------------------------- |
| `mundo`    | Todo el estado (naciones, empresas, economía, mercado, IA, ...). |
| `economia` | PIB, productividad global, período e histórico.                  |
| `mercado`  | Cotizaciones y capitalizaciones.                                 |
| `recursos` | Recursos con disponibilidad y precio.                            |
| `empresas` | Empresas con productividad, aporte al PIB y subsidiarias.        |
| `estadoSimulacion` | Reloj en vivo (play/pausa, velocidad, ticks).            |
| `predecir(periodos)` | Proyección aislada del sistema.                        |

Mutations principales:

| Mutation                                                | Efecto                                |
| ------------------------------------------------------- | ------------------------------------- |
| `avanzarPeriodo(periodos: Int)`                         | Corre N ciclos de simulación.         |
| `ajustarProductividad(empresa: String!, valor: Float!)` | Fija la productividad de una empresa. |
| `adquirirEmpresa(objetivo: String!, porIA: Boolean)`    | Compra una empresa vía mercado.       |
| `toggleLey(id: String!)`                                | Activa/desactiva una ley.             |
| `crearEmpleado(input)` / `crearAgente(input)`           | Altas.                                |
| `comprarPropiedad(id: String!)`                         | La empresa compra una propiedad.      |
| `iniciarSimulacion(intervaloMs, periodosPorTick)`       | Arranca el reloj en vivo.             |
| `pausarSimulacion`                                      | Pausa el reloj.                       |
| `ajustarSimulacion(intervaloMs, periodosPorTick)`       | Cambia la velocidad.                  |
| `reiniciar`                                             | Restaura el mundo inicial.            |

## Persistencia (SQLite)

El estado variable del mundo vive en **SQLite** vía `bun:sqlite` (sin dependencias
externas). El archivo va en `POLIMORFISMO_DB` (por defecto `<repo>/data/mundo.db`).

- **Al arrancar**: si hay estado guardado, se carga; si no, se siembra la simulación
  (12 períodos), se guarda el estado y se guarda la **semilla**.
- **Después de cada mutación** (avanzar período, adquirir, ajustar productividad,
  activar ley, crear empleado/agente, comprar propiedad) se reescribe el estado.
- **`reiniciar`** vuelve a la semilla (no a cero): es el estado tal como quedó la
  primera siembra.
- Tablas: `economia`, `recurso`, `empresa`, `cotizacion`, `ley`, `punto_economico`,
  `empleado`, `propiedad`, `agente` y `meta` (guarda la semilla como JSON).

Lo que **no** se persiste (vive en los fixtures): naciones, estados, definición de leyes,
propiedades (salvo su dueño), la estructura de las empresas y las personas.

## Límites y escalado

Simplificaciones **deliberadas** (para que el TP sea navegable):

- **Sin agentes del mercado.** No hay otras empresas comprando/vendiendo ni liquidez real;
  el precio se mueve por fórmula, no por oferta y demanda.
- **Sin inflación ni tasas.** El PIB es nominal; no hay deflactor.
- **Productividad con una sola fórmula lineal.** No hay elasticidades calibradas.
- **Recursos independientes entre sí.** No hay sustitución (si falta agua, no se usa otra cosa).
- **Sin impuestos sobre el PIB.** Las leyes afectan sueldos/propiedades/IA, no el PIB.
- **Sin quiebras ni despidos automáticos.** Una empresa con capital negativo no desaparece.

Si esto creciera, el orden razonable sería: (1) persistencia (SQLite), (2) libro de órdenes
con oferta y demanda reales, (3) inflación/tasas y un banco central, (4) leyes que afecten
el PIB y los recursos, (5) quiebras y desempleo, (6) eventos exógenos (sequías, crisis).

## Referencias

- Código del ciclo: `src/services/simulacion.ts`
- Dominio: `src/domain/` (`Economia`, `Mercado`, `Accion`, `Recurso`, `Ambiente`)
- Esquema GraphQL: `src/server/schema.ts`
- UI: `web/src/views/` (Economía, Mercado, Recursos)
