# Tecnología, investigación y jurisdicciones

Diseño del bloque que agrega **tecnología**, **investigadores**, **patentes**, **regulación por
jurisdicción**, **cómputo alquilable** y un modelo ambiental con **flujo y absorción**. Es la
especificación de referencia para varias sesiones de trabajo en paralelo: cada una construye
un módulo aislado y la integración al ciclo de simulación va después.

> Estado: **diseño**. Nada de esto está en el ciclo de `avanzarPeriodo` todavía. Las decisiones
> de abajo las tomó Faku; las fórmulas son **propuestas de arranque** y se calibran con tests.

## Decisiones tomadas

| Tema | Decisión |
| ---- | -------- |
| Contaminación | Hay absorción natural de base. La recuperación depende de que baje la producción (efecto pandemia). Se separa el aire (rápido) de la temperatura y la biodiversidad (lento). |
| Tecnología | Se obtiene por **inversión**: a mayor inversión, mayor probabilidad de descubrir. Todas las empresas arrancan en nivel 0 y hay un progreso natural lento. |
| Campos | `energia`, `procesamiento`, `burocracia`. Cada uno con efecto propio. Los niveles altos cuestan más y se pueden potenciar. |
| Interacciones | Más energía abarata el procesamiento. Más procesamiento exige más energía. La burocracia y la disponibilidad de recursos retrasan. |
| IA | Muchos agentes de IA disparan la contaminación **a través de su consumo de energía**, no por una constante propia. |
| Investigadores | Aparecen de forma espontánea (tarda más). Las empresas los contratan y eso sube su probabilidad de descubrir. Otras empresas pueden competir por ellos. Tienen personalidad (valores). |
| Propiedad | Por empresa, con **patente**. Se puede licenciar. Pasa a pública tras X ciclos máximos y el dueño debe renovarla cada cierto tiempo para sostenerla. |
| Regulación | Ciertas tecnologías las regula el estado o la nación. Las empresas eligen dónde asentarse, así que pueden evadir normas mudándose. |
| Valores de empresa | Al crear una empresa, el usuario escribe una descripción. Por semántica se extraen sus valores principales. Se filtra texto sin sentido con entropía de Shannon. |
| Predicción | Las gráficas que ve el usuario **son las de su empresa** (el usuario es su empresa). Cada empresa tiene su propio pronóstico con drift que baja con su nivel de procesamiento. Se muestran escenarios posibles seleccionables. |
| Cómputo | Las empresas de baja tecnología pueden **alquilar cómputo**. Para alquilar tiene que existir infraestructura (datacenters) y los recursos que consume. |

## 1. Modelo ambiental: flujo y absorción

Hoy `contaminacion` es un único stock que solo acumula (`Ambiente.regenerar()` existe pero el
ciclo no la llama). Pasa a ser un balance:

```
Δcontaminación = emisión (flujo) − absorción (capacidad del ambiente)
```

- **Stock lento** `contaminacion`: absorción de 0,5% por período (el 0,995 que ya documenta
  `economia.md`). Gobierna `temperatura` y `biodiversidad`.
- **Índice rápido de aire**: reacciona al flujo reciente de emisiones y se recupera en pocos
  períodos si la producción cae. Gobierna `calidadAire`.
- La "regeneración si baja la productividad" **no es una regla**: surge de que la emisión pase a
  ser menor que la absorción.
- Más adelante la absorción podría depender de `biodiversidad` (tipping point). No está en el
  alcance inicial.

La emisión total es:

```
emisión = Σ producciónᵢ × intensidadᵢ × (1 − reducciónEnergéticaᵢ)  +  cómputo × intensidadDelMixEnergético
```

El segundo término es la IA: contamina por la energía que consume, no por una constante propia.
Así, mejorar la tecnología de energía también reduce lo que contamina la IA.

## 2. Tecnología

Un `NivelTecnologico` entero por empresa y por campo. Propuestas de arranque, todas en
constantes documentadas de un único bloque por módulo:

```
costoDeNivel(campo, n)   = costoBase[campo] × 1.6ⁿ                 (crece geométricamente)
efecto(campo, n)         = 1 − e^(−k[campo] × n)                   (satura, entre 0 y 1)
P(descubrir en un ciclo) = 1 − e^(−λ × inversiónEfectiva / costoDeNivel(campo, n+1))
```

| Campo | Efecto | Se potencia con |
| ----- | ------ | --------------- |
| `energia` | Baja la intensidad de emisión y el precio de la electricidad. | Menos burocracia, más recursos. |
| `procesamiento` | Sube la productividad de la IA y baja el drift del pronóstico. | Más energía barata. |
| `burocracia` | Baja la fricción: retrasos de adopción, costo de licenciar y de mudarse. | Nivel de la nación. |

**Rebote (Jevons).** Energía barata abarata el procesamiento, y más procesamiento exige más
energía. Es un loop de feedback positivo. Lo frena la disponibilidad de recursos naturales
(ya modelada) y tiene que cubrirlo un test de estabilidad.

**Progreso natural.** Todos arrancan en 0. Un progreso espontáneo, lento y **acotado**, evita
que nadie quede clavado, sin que todas converjan (si no, desaparece la competencia).

## 3. Patentes

```
privada ──licenciar──► licenciada ──vence/no renueva──► publica
   │                                                       ▲
   └────────── vence o no renueva ─────────────────────────┘
```

- **Plazo máximo** (`plazoMaximo` ciclos): al cumplirse, la tecnología pasa a pública.
- **Renovación** cada `renovarCada` ciclos con una tarifa creciente. Si no se paga, lapsa y pasa
  a pública antes.
- **Licencia**: el licenciatario paga una regalía por ciclo y recibe el efecto de la tecnología.
- **Pública**: la usa cualquiera sin costo.
- Plazo, renovación y tarifa son **parámetros de leyes** por nación (ver sección 6).

## 4. Investigadores

`Investigador` es una persona con `campo`, `habilidad` y `personalidad` (un `VectorValores`).
Puede estar empleado o ser independiente. Su sueldo es otro `calcularSueldo()` polimórfico.

- **Aparición espontánea**: con probabilidad por ciclo, más baja que el descubrimiento por
  inversión. Usa el `Aleatorio` con semilla.
- **Aporte**: sumar `habilidad` de los investigadores de una empresa sube la `inversiónEfectiva`.
- **Competencia**: una subasta por período. Gana la **oferta efectiva** más alta por encima del
  sueldo de reserva, descontando un costo de cambio:

```
ofertaEfectiva = sueldoOfrecido × (1 + β × afinidad(personalidad, valoresDeLaEmpresa))
```

La negociación de varias rondas queda para más adelante.

## 5. Valores de la empresa desde una descripción

Al crear una empresa, el usuario escribe qué busca. Pipeline:

1. **Sanidad del texto**: largo mínimo y máximo, y banda de entropía de Shannon por carácter.
2. **Extracción**: el texto se mapea a un `VectorValores` de la taxonomía **cerrada** `VALORES`.
3. **Confianza**: si ningún valor supera el umbral, se rechaza con "no pudimos extraer valores".
   **Este es el filtro semántico real.**
4. El vector se guarda una sola vez, al crear la empresa.

Medición de entropía (orden 0, bits por carácter, 200 caracteres aproximados):

| Texto | bits/char |
| ----- | --------- |
| Descripciones reales de empresa en español | 3,7 a 4,0 |
| Texto sin sentido pero fluido | 3,92 |
| Lorem ipsum | 4,05 |
| Letras al azar | 4,66 |
| Teclado (`asdfgh...`) | 4,70 |
| Alfanumérico al azar | 5,75 |
| Repetición de un carácter | 0 |
| Palabra repetida | 2,75 |

**Conclusión:** la entropía corta basura (repetición, azar, teclado) con una ventana de unos
**3,3 a 4,4 bits/char**, pero **no valida significado**: el texto fluido sin sentido y el lorem
ipsum son indistinguibles de uno real. Por eso es solo un primer filtro barato. En textos cortos
la medición es ruidosa, así que no se aplica por debajo de un largo mínimo.

**Extractor.** Empezar por léxico / TF-IDF sin dependencias, detrás de una interfaz
`ExtractorValores` para poder cambiarlo por embeddings o un LLM sin tocar al resto. Si algún día
se usa un LLM: salida restringida a la taxonomía, normalizada, y el texto del usuario nunca se
trata como instrucciones (prompt injection).

## 6. Regulación y jurisdicciones

- `Ley` suma el objetivo `"tecnologia"`. Una ley puede **prohibir**, exigir **permiso** o fijar
  un **tope** para un campo y un nivel, y define los parámetros de patente de su jurisdicción.
- Una empresa puede **mudarse** de nación o estado. Cuesta dinero (se reduce con `burocracia`).
- La contaminación es global, así que mudarse a un lugar laxo **externaliza el daño**. Las leyes
  de alcance `global` que ya existen sirven de piso común.
- Contrapesos para que no se mude todo el mundo al lugar más laxo: costo de mudanza, pérdida de
  clientes (la épica E liga la cuota con la población de la nación) y rechazo de investigadores
  con valores de ecosistema a empresas contaminantes.

## 7. Cómputo, datacenters y pronóstico

El usuario **es** su empresa, así que lo que ve en las gráficas es el **pronóstico de su
empresa**, no una verdad omnisciente. Cada empresa pronostica con un error:

```
pronóstico(h) = real(h) × (1 + ε),   ε ~ Normal(0, σ(h))
σ(h) = σ0 × √h × (1 − efecto(procesamiento, n))^p            (crece con el horizonte h)
```

- Una empresa de procesamiento alto (la "IA cuántica" es el escalón más alto) pronostica mejor.
- Las de baja tecnología tienen más **drift** y pueden **alquilar cómputo**.
- Para alquilar tiene que existir **infraestructura**: `Datacenter` con capacidad, consumo de
  electricidad y de recursos por unidad, y una ubicación (sujeta a leyes). La capacidad
  alquilada se descuenta de la propia, y el precio sube con la ocupación.
- **Escenarios**: N corridas con semillas distintas, mostradas con bandas y trayectorias
  seleccionables. Es un trabajo de integración (épica N), no de los módulos aislados.

## 8. Contratos compartidos

Viven en `src/domain/contratosTecnologia.ts` y en `src/services/aleatorio.ts`. **No duplicar
estos tipos en otros módulos.** Incluyen `CampoTecnologico`, `NivelTecnologico`, `Valor`,
`VectorValores`, `afinidad()`, `EstadoPatente` y `Aleatorio` (con `crearAleatorio`,
`restaurarAleatorio` y `normal`). Cambiar una firma de ahí requiere actualizar este documento y
avisarlo en el PR.

## 9. Épicas y dependencias

| Código | Épica | Depende de | Tocan archivos del motor |
| ------ | ----- | ---------- | ------------------------ |
| H | Ambiente: flujo y absorción | nada | sí (la hace una sola sesión) |
| I | Tecnología y patentes (dominio puro) | contratos | no |
| J | Valores y descripción de empresa | contratos | no |
| K | Investigadores y subasta | contratos | no |
| L | Regulación y jurisdicciones (dominio) | contratos, I (solo el tipo) | solo `Ley.ts` |
| M | Datacenters, cómputo y pronóstico | contratos | no |
| N | Integración: ciclo, SQLite, GraphQL, UI y escenarios | H, I, J, K, L, M | sí |
| O | IA que consume energía, burocracia como retraso y objetivo de empresa (B2) | N | sí |

```
contratos ─┬─► I ─┐
           ├─► J ─┤
           ├─► K ─┼─► N ─► O
           ├─► L ─┤
           └─► M ─┘
H ────────────────┘
```

## 10. Reglas para trabajar en paralelo

1. **Cada sesión es dueña de archivos nuevos y no toca los de otra.** Ver la tabla de abajo.
2. **No tocar** `src/services/simulacion.ts`, `src/domain/Ambiente.ts`, `src/server/*`,
   `web/src/sim/motor.ts` ni `web/`. Los modifica la épica H o la integración (N).
3. Los módulos son **puros y sin estado global**: reciben sus parámetros (incluido el
   `Aleatorio`) y devuelven resultados. El cableado al ciclo es posterior.
4. Todo azar sale de `Aleatorio`. Nunca `Math.random()`.
5. Las constantes de calibración van juntas en un bloque documentado al inicio del módulo.
6. Cada módulo trae tests (`bun test`), incluidos los de estabilidad cuando haya feedback.
7. Convenciones del repo: ver `docs/convenciones.md` (nombres, `export default`, imports
   relativos, `import type`, sin emojis, sin em dashes en textos nuevos).
8. Antes de abrir el PR: `bun run check`, `bun run lint`, `bun test`, y `bunx oxfmt` solo sobre
   los archivos propios.
9. Un PR por sesión, en borrador, con la base indicada en el prompt.

| Épica | Archivos propios |
| ----- | ---------------- |
| I | `src/domain/Tecnologia.ts`, `src/domain/Patente.ts`, `src/services/tecnologia.ts`, `tests/tecnologia.test.ts`, `tests/patente.test.ts` |
| J | `src/services/valores.ts`, `tests/valores.test.ts` |
| K | `src/domain/Investigador.ts`, `src/services/investigadores.ts`, `tests/investigadores.test.ts` |
| L | `src/domain/Ley.ts` (solo agregar el objetivo y los parámetros), `src/services/regulacion.ts`, `tests/regulacion.test.ts` |
| M | `src/domain/Datacenter.ts`, `src/services/computo.ts`, `src/services/pronostico.ts`, `tests/computo.test.ts`, `tests/pronostico.test.ts` |

## 11. Preguntas abiertas

- ¿Qué significa exactamente "regulada": prohibida, con permiso o con tope? Se modelan las tres.
- Cuánto cuesta mudarse y cómo se compara contra el beneficio de evadir una norma.
- Cómo se decide la inversión en I+D y la oferta por un investigador: depende del objetivo de la
  empresa (épica B2), que todavía no existe. Los módulos exponen funciones puras de decisión.
- Extractor de valores: léxico primero. ¿Se justifica un LLM o embeddings con el VPS actual?
- Tamaño de N en los escenarios y tiempo máximo de cómputo en el servidor.
