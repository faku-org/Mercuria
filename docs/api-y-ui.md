# API y UI

El backend expone el dominio por **GraphQL** (`src/server/`) y la UI (`web/`) lo consume
por ese mismo endpoint. El estado variable se persiste en **SQLite** (ver
[Persistencia](economia.md#persistencia-sqlite)).

```bash
bun run serve     # API + UI en http://localhost:3011/
bun run web:dev   # UI en modo dev (:3010, proxy /graphql → :3011)
bun run web:build # genera web/dist, que `serve` sirve en la raíz
```

Con `web/dist` presente, **un solo puerto** sirve la UI en `/` y la API en `/graphql`
(con GraphiQL). Sin build, `/graphql` sigue funcionando y `/` da 404.

## Endpoint

| Ruta              | Qué es                                                  |
| ----------------- | ------------------------------------------------------- |
| `GET /`           | `web/dist/index.html` (la UI).                          |
| `GET /assets/*`   | Bundle de la UI (JS/CSS).                               |
| `GET /api/salud`  | Health check (`{ ok, servicio, web }`).                 |
| `GET /api/stream` | SSE: empuja el `Mundo` en cada tick o mutación.         |
| `ALL /graphql`    | GraphQL: queries, mutations y GraphiQL en el navegador. |

## Queries

| Query          | Devuelve                                                        |
| -------------- | --------------------------------------------------------------- |
| `mundo`        | Todo el estado en un objeto `Mundo`.                            |
| `economia`     | PIB, productividad global, recursos, ambiente e histórico.      |
| `mercado`      | Índice y cotizaciones.                                          |
| `recursos`     | Recursos con disponibilidad, escasez y precio.                  |
| `empresas`     | Empresas con productividad, aporte al PIB y subsidiarias.       |
| `empleados`    | Nómina cruda (sueldo base, factor leyes, factor productividad). |
| `nomina`       | Líneas + totales + productividad global.                        |
| `naciones`     | Naciones con sus leyes.                                         |
| `estados`      | Estados con sus leyes estatales.                                |
| `leyes`        | Todas las leyes.                                                |
| `resumenLeyes` | Cantidad y factor total por objetivo.                           |
| `ais`          | IAs con agentes, sueldo y empresas adquiridas.                  |
| `propiedades`  | Propiedades con precio ajustado por leyes y dueño.              |
| `estadoSimulacion` | Reloj en vivo: play/pausa, velocidad, períodos/tick y ticks. |
| `predecir(periodos)` | Proyección por simulación aislada (no toca el estado real). |
| `yo` | Usuario de la sesión (o `null`). |
| `resumen` | Resumen de ausencia del usuario: métricas + eventos + sus empresas. |
| `eventos(desde)` | Bitácora de eventos del mundo. |

> Los campos de `Mundo` también existen en la raíz del esquema, así la UI puede pedir
> exactamente lo que necesita en un solo round-trip.

## Mutations

| Mutation                               | Efecto                                                      |
| -------------------------------------- | ----------------------------------------------------------- |
| `avanzarPeriodo(periodos: Int)`        | Corre N ciclos de simulación y devuelve la `Economia`.      |
| `ajustarProductividad(empresa, valor)` | Fija la productividad de una empresa (recalcula la global). |
| `adquirirEmpresa(objetivo, porIA)`     | Compra una empresa vía mercado (prima 20%).                 |
| `toggleLey(id)`                        | Activa/desactiva una ley.                                   |
| `crearEmpleado(input)`                 | Alta de empleado (`fijo`, `porHora`, `vendedor`, `jefe`).   |
| `crearAgente(input)`                   | Alta de agente de la IA.                                    |
| `comprarPropiedad(id)`                 | La empresa compra una propiedad.                            |
| `reiniciar`                            | Vuelve a la semilla guardada en SQLite.                     |
| `iniciarSimulacion(intervaloMs, periodosPorTick)` | Arranca el reloj en vivo.                       |
| `pausarSimulacion`                     | Pausa el reloj y persiste lo pendiente.                     |
| `ajustarSimulacion(intervaloMs, periodosPorTick)` | Cambia la velocidad sin tocar play/pausa.        |
| `registrar(handle, pin, nombre)`       | Crea una cuenta y devuelve una sesión.                     |
| `login(handle, pin)`                   | Inicia sesión y devuelve un token.                        |
| `logout`                               | Cierra la sesión del token actual.                        |
| `fundarEmpresa(nombre, capitalInicial)` | Crea una empresa propia del usuario.                    |
| `adquirirComoUsuario(objetivo, comprador)` | Una empresa del usuario compra otra del sistema.      |

Las mutations devuelven `Resultado { ok, motivo, detalle, costo }` (salvo las que
devuelven `Economia`, `Mundo` o `EstadoSimulacion`), así la UI puede mostrar por qué falló
una operación.

```graphql
# ejemplo
mutation {
  adquirirEmpresa(objetivo: "Nova Labs", porIA: true) {
    ok
    motivo
    detalle
    costo
  }
}
query {
  economia {
    periodo
    pibGlobal
    productividadGlobal
  }
  mercado {
    indice
    cotizaciones {
      empresa
      precio
      capitalizacion
    }
  }
}
```

## Simulación en vivo

El reloj corre **en el servidor** (`src/server/reloj.ts`): una sola fuente de verdad para
todos los clientes. **Arranca solo** al levantar el proceso (`autostart` en
`src/server/index.ts`), así que la economía avanza aunque no haya nadie conectado. La
cadencia sale de `POLIMORFISMO_TICK_MS` (default `30000`, o sea un período cada 30 s) y se
puede desactivar con `POLIMORFISMO_SIM_AUTOSTART=0`. La UI manda la intención
(`iniciarSimulacion` / `pausarSimulacion` / `ajustarSimulacion`) y recibe el estado por dos
caminos:

1. **SSE** en `GET /api/stream`: un snapshot del `Mundo` al conectar y otro en cada tick o
   mutación. La UI lo consume con `EventSource` (`web/src/api.ts` → `suscribirMundo`).
2. **Query `estadoSimulacion`**: play/pausa, velocidad, períodos/tick y cantidad de ticks.

El bus de eventos (`src/server/eventos.ts`) desacopla "el mundo cambió" de "avisar a los
clientes": `publicar()` se llama en cada mutación persistida y en cada tick.

### Predicción aislada

`predecir(periodos)` corre la simulación **N períodos hacia adelante sobre una copia** del
mundo (`src/services/prediccion.ts` clona recursos, ambiente, empresas y mercado). Devuelve
una serie `PuntoEconomico[]` sin tocar el estado real: el `periodo`, el histórico, las
productividades y las cotizaciones reales quedan intactos.

```graphql
query {
  predecir(periodos: 12) {
    periodos
    periodoInicial
    pibFinal
    productividadFinal
    puntos { periodo pib productividadGlobal indiceMercado }
  }
}
```

### Usuarios y empresas propias

- `registrar(handle, pin, nombre)` crea la cuenta y devuelve `{ token, usuario }`; `login`
  hace lo mismo con una cuenta existente. El token viaja en `Authorization: Bearer <token>`
  y el PIN se guarda hasheado con `Bun.password` (nunca en claro).
- `fundarEmpresa(nombre, capitalInicial)` crea una empresa con `duenio = handle` y la lista
  en el mercado; `adquirirComoUsuario(objetivo, comprador)` hace que una empresa del usuario
  compre otra del sistema.
- `resumen` devuelve lo que pasó desde `ultimoVisto` del usuario (variación de métricas +
  eventos) y actualiza ese marcador. `eventos(desde)` expone la bitácora cruda.

## UI

`web/` es un panel de lectura con acciones puntuales. Arriba de todo hay una **barra de
simulación** (iniciar/pausar, velocidad y períodos por tick) que gobierna el reloj del
servidor; el resto de las vistas se actualizan solas por SSE. Pestañas:

| Pestaña      | Muestra                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Economía     | Predicción aislada, PIB, productividad global, disponibilidad, histórico (sparklines) y botones para avanzar 1/10 períodos y fijar la productividad de cada empresa. |
| Mercado      | Cotizaciones, variación, capitalización y adquisición por parte de la Empresa Demo o de la IA.                                                   |
| Recursos     | Disponibilidad y precio de cada recurso, contaminación, temperatura e impacto ambiental.                                                         |
| Nómina       | Sueldo base, factor de leyes, factor de productividad y sueldo final + totales.                                                                  |
| Naciones     | Naciones y estados con capital, idioma, población y sus leyes.                                                                                   |
| Leyes        | Efecto, magnitud y alcance de cada ley; botón activar/desactivar.                                                                                |
| Propiedades  | Precio con leyes, ubicación, dueño y botón de compra.                                                                                            |
| Empresas     | Capital, productividad, ubicación, jefe, plantilla, propiedades, cotización, capitalización, valor contable, IA y subsidiarias.                  |
| IA y agentes | Sueldo de la IA, empresas adquiridas, agentes por sector, costo de uso y alta de agente.                                                         |
| Cuenta       | Login/registro (handle + PIN), resumen de ausencia (métricas + eventos), empresas propias (fundar/adquirir) y bitácora reciente.                  |

Stack: React 19 + Vite + TailwindCSS v4 + `lucide-react`. Gráficos: un `Sparkline` en SVG
propio (sin librería de charts). Estilo: paleta neutra con un solo acento
(`--color-accent`), sin degradados.

## Exposición

El servicio corre como `polimorfismo.service` (systemd, loopback `127.0.0.1:3011`) y se
expone **público** por nginx + Cloudflare:

- `https://polimorfismo.eternum.lat/` (UI) y `/graphql` (API).
- Registro CF: `CNAME polimorfismo.eternum.lat → eternum.lat`, proxied.
- Vhost: `~/deploy/nginx/polimorfismo.eternum.lat.conf` → `127.0.0.1:3011`, cert por
  DNS-01 (`/etc/letsencrypt/live/polimorfismo.eternum.lat/`).
- Base de datos del servicio: `/home/hermes/srv-data/polimorfismo/mundo.db`.

También queda un `tailscale serve` en `https://vps-660e4a8c.tail7f613b.ts.net:8445/`
(tailnet only) como acceso interno.

> **Sin autenticación.** Cualquiera con la URL puede consumir la GraphQL, incluidas las
> mutations. Es un TP con datos de prueba, pero si molesta se resuelve con Basic Auth en
> el vhost.

> Tailscale **Funnel** (público sin nginx) se probó y se descartó: el ingress
> `ingress-nyc-01` de Tailscale devolvía "Broken pipe" en 3 de 4 verificaciones externas
> (check-host desde Alemania, Indonesia y Singapur; solo Suecia dio 200).

## Ideas para seguir

- ~~Suscripciones GraphQL para ver la simulación en vivo sin refrescar~~ → resuelto por SSE
  (`/api/stream`).
- Edición en la UI (capital, acciones, leyes) además de las acciones actuales.
- Tests del esquema GraphQL (introspection + queries de humo).
- Libro de órdenes real en el mercado (hoy el precio lo fija una fórmula).
- Épicas B–F del modelo realista (sector, objetivo, IA, estatales, clientes): ver
  [issues.md](./issues.md).
