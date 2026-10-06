# Issues — Simulación en vivo y modelo realista

Tablero de trabajo para la feature de **simulación en tiempo real**. Los issues viven en
GitHub (repo [`fakuuy/polimorfismo`](https://github.com/fakuuy/polimorfismo/issues)) y acá
queda el plan **ordenado por dependencia**: un issue solo se empieza cuando sus
dependencias están cerradas.

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.

| Código | Issue | GitHub |
| ------ | ----- | ------ |
| A1 | Reloj de simulación en el servidor | [#21](https://github.com/fakuuy/polimorfismo/issues/21) |
| A2 | Stream SSE /api/stream + bus de eventos | [#22](https://github.com/fakuuy/polimorfismo/issues/22) |
| A3 | UI en vivo: barra de control + EventSource | [#23](https://github.com/fakuuy/polimorfismo/issues/23) |
| A4 | Predicción por simulación aislada | [#24](https://github.com/fakuuy/polimorfismo/issues/24) |
| B1 | Sector de la empresa + catálogo | [#25](https://github.com/fakuuy/polimorfismo/issues/25) |
| B2 | Objetivo de la empresa | [#26](https://github.com/fakuuy/polimorfismo/issues/26) |
| B3 | Empleados productivos vs. plantilla | [#27](https://github.com/fakuuy/polimorfismo/issues/27) |
| B4 | Productividad combinada | [#28](https://github.com/fakuuy/polimorfismo/issues/28) |
| C1 | Catálogo de modelos de IA con curva | [#29](https://github.com/fakuuy/polimorfismo/issues/29) |
| C2 | Adopción de modelos por las empresas | [#30](https://github.com/fakuuy/polimorfismo/issues/30) |
| C3 | AIs rogue | [#31](https://github.com/fakuuy/polimorfismo/issues/31) |
| D1 | EmpresaEstatal que provee recursos | [#32](https://github.com/fakuuy/polimorfismo/issues/32) |
| D2 | Provisión de recursos en el ciclo | [#33](https://github.com/fakuuy/polimorfismo/issues/33) |
| E1 | Cuota de mercado (clientes vs. población) | [#34](https://github.com/fakuuy/polimorfismo/issues/34) |
| E2 | Beneficio a capital, PIB y cotización | [#35](https://github.com/fakuuy/polimorfismo/issues/35) |
| F1 | GraphQL + DTOs de los campos nuevos | [#36](https://github.com/fakuuy/polimorfismo/issues/36) |
| F2 | Persistencia SQLite de los campos nuevos | [#37](https://github.com/fakuuy/polimorfismo/issues/37) |
| F3 | UI de los campos nuevos | [#38](https://github.com/fakuuy/polimorfismo/issues/38) |
| F4 | Tests + docs del modelo en vivo | [#39](https://github.com/fakuuy/polimorfismo/issues/39) |
| EPIC | Hilo de seguimiento | [#40](https://github.com/fakuuy/polimorfismo/issues/40) |

## Mapa de dependencias

```
A1 ─► A2 ─► A3 ─► A4            (tiempo real: servidor → stream → UI → predicción)
B1 ─► B2 ─► B3 ─► B4            (empresa: sector → objetivo → plantilla → productividad)
B4 ─► C1 ─► C2 ─► C3            (IA: catálogo → adopción → rogue)
B1 ─► D1 ─► D2                  (estatales: empresa estatal → provisión de recursos)
B1 ─► E1 ─► E2                  (clientes: cuota → beneficio)
A4, B4, C2, D2, E2 ─► F1 ─► F2 ─► F3 ─► F4   (exposición, persistencia, UI, tests/docs)
```

## Épica A — Simulación en tiempo real (servidor)

- [x] **A1 — Reloj en el servidor.** Motor con play/pausa, velocidad (intervalo) y
      períodos por tick. `src/server/reloj.ts`. Persiste cada N ticks para no golpear
      SQLite en cada cuadro.
- [x] **A2 — Stream SSE.** Bus de eventos (`src/server/eventos.ts`) + `GET /api/stream`.
      Cada cambio (mutación o tick) empuja el `Mundo` completo a todos los clientes.
- [x] **A3 — UI en vivo.** Barra de control global (iniciar/pausar/velocidad) y conexión
      `EventSource` que actualiza el mundo sin refrescar.
- [x] **A4 — Predicción por simulación aislada.** `src/services/prediccion.ts` clona el
      mundo (recursos, ambiente, empresas, mercado) y corre N períodos sobre la copia sin
      tocar el estado real. Query `predecir(periodos)` + panel en la vista Economía.

## Épica B — Modelo de empresa

- [ ] **B1 — Sector.** `domain/Sector.ts` + `fixtures/sectoresBase.ts`. Cada empresa
      declara a qué sector pertenece (tecnología, industria, energía, agro, servicios…)
      con su perfil de productividad, consumo de recursos, emisión y demanda.
- [ ] **B2 — Objetivo de la empresa.** Qué busca (beneficio, crecimiento, cuota de
      mercado, estabilidad). Modula cómo reinvierte y cómo varía su productividad.
- [ ] **B3 — Empleados productivos vs. plantilla.** Separar la cantidad de empleados que
      realmente producen del total contratado. La cantidad de empleados **no** es
      proporcional a la productividad.
- [ ] **B4 — Productividad combinada.** La productividad de la empresa pasa a depender del
      sector, los empleados productivos, los agentes de IA y el entorno (recursos +
      ambiente). Los agentes de IA sí tienen productividad constante por modelo.

## Épica C — IA

- [ ] **C1 — Catálogo de modelos.** `domain/ModeloIA.ts` + `fixtures/modelosBase.ts` con
      productividad, costo de adquisición y costo de uso por nivel. La curva arranca en
      modelos simples, poco productivos y caros, y evoluciona a modelos más rápidos,
      baratos por unidad y más abundantes.
- [ ] **C2 — Adopción de modelos.** Las empresas adquieren modelos a lo largo de los
      períodos según su objetivo y capital. El costo de adquisición es alto; la
      productividad del modelo es constante.
- [ ] **C3 — AIs rogue.** Riesgo de que una IA se vuelva rogue y su efecto sobre la
      economía y el mercado (factor determinante adicional).

## Épica D — Empresas estatales y recursos

- [ ] **D1 — `EmpresaEstatal`.** Empresa pública que provee un recurso (energía, agua…),
      con disponibilidad objetivo y precio regulado.
- [ ] **D2 — Provisión de recursos.** En el ciclo, las estatales reponen/fijan recursos y
      las privadas los consumen y pagan; el precio refleja escasez y regulación.

## Épica E — Clientes

- [ ] **E1 — Cuota de mercado.** Cada empresa gana `clientes` en función de la población
      de su nación (con una minoría internacional). La cuota mide qué tan buena es.
- [ ] **E2 — Beneficio.** `beneficio = clientes × margen × precio`; alimenta capital, PIB
      y cotización.

## Épica F — Exposición y calidad

- [ ] **F1 — GraphQL + DTOs** de todos los campos nuevos (sector, objetivo, clientes,
      modelos, estatales, rogue).
- [ ] **F2 — Persistencia** en SQLite de los campos nuevos + semilla.
- [ ] **F3 — UI** de los campos nuevos (sector, objetivo, clientes/cuota, modelos, estatales).
- [ ] **F4 — Tests + docs** (dominio, simulación, predicción, esquema).

## Notas

- Transporte en vivo: **reloj en el servidor + SSE** (un solo puerto; sin dependencias
  nuevas, igual que el resto del proyecto).
- Predicción: **simulación aislada** sobre una copia del mundo.
- La UI sigue sin importar código del backend: los tipos de `web/src/types.ts` son espejo
  de los DTOs de `src/server/`.
