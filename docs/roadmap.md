# Roadmap

Checklist de trabajo. `[x]` = hecho, `[ ]` = pendiente.

## Requerimientos mínimos

- [x] Empleado fijo: cobra un sueldo mensual de $50.000
- [x] Empleado por hora: cobra según la cantidad de horas trabajadas
- [x] Vendedor: cobra un sueldo base más una comisión por ventas
- [x] Clase `Empleado` con método `calcularSueldo()`
- [x] Tres clases que hereden de `Empleado`: `EmpleadoFijo`, `EmpleadoPorHora`, `Vendedor`
- [x] Sobrescribir `calcularSueldo()` en cada subclase
- [x] Crear varios empleados de distintos tipos en un mismo array
- [x] Recorrer el array y ejecutar `calcularSueldo()` en cada empleado

## Extras

### Naciones — `domain/Nacion.ts`

- [x] Clase con nombre, id, capital, idioma, población y leyes
- [x] Servicio `obtenerNaciones()` en `services/naciones.ts`
- [x] Registrar las leyes propias de la nación (`registrarLey`)
- [x] Aplicar las leyes de la nación (`factorLeyes`)
- [x] Poblar naciones de prueba en `fixtures/` (United States, Uruguay)

### Leyes — `domain/Ley.ts`

- [x] Clase con nombre, id, descripción, `afecta` y `activa`
- [x] Modelar el efecto (positivo/negativo), la magnitud y el objetivo
- [x] Aplicar la ley sobre sueldos, propiedades y AI
- [x] Implementar "afecta a todas las naciones" (`alcance: "global"`)

### Estados — `domain/Estado.ts`

- [x] Clase que hereda de `Nacion` con leyes de tipo `LeyEstatal`
- [x] Resolver prioridad entre leyes de nación y de estado
- [x] Asociar cada estado a su nación (`nacion: Nacion`)

### Propiedades — `domain/Propiedad.ts`

- [x] Clase con nombre, precio, ubicación y dueño
- [x] Operaciones de compra y venta
- [x] Aplicar leyes sobre precios y límite de propiedades

### AI — `domain/AI.ts`

- [x] Entidad con propiedades, empleados y empresas
- [x] Sueldo de la AI afectado por leyes
- [x] Validar que una AI siempre fue creada por una empresa

### Agentes — `domain/Agente.ts`

- [x] Clase con sector asignado
- [x] Costo de uso según productividad y modelo
- [x] El agente hereda su AI matriz al crearse (`aiMatriz`) y queda registrado en `agentes`
- [x] Relación AI → sector → agentes (`agentesDeSector`)

### Identificadores — `domain/identificadores.ts`

- [x] Iniciales automáticas desde el nombre o modelo (`iniciales()`)
- [x] Fecha en formato `YYYY-MM-DD` (`fechaId()`)
- [x] Ids con formato para Estado, Agente, Ley y LeyEstatal

### Sueldo — `domain/Sueldo.ts`

- [x] Clase con monto y flag `deduce`
- [x] Exportar la clase
- [x] Diferenciar sueldo fijo de variable (`tipo`)
- [x] Aplicar leyes de nación/estado al cálculo (`conLeyes`)

### Empresa — `domain/Empresa.ts`

- [x] Clase con nombre, id, empleados, capital y propiedades
- [x] Tipar `propiedades` como `Propiedad[]`
- [x] Jerarquía jefe → equipo de empleados (`Jefe.supervisar`, `costoEquipo`)
- [x] Aplicar leyes de nación/estado (`factorLeyes`)
- [x] Vincular empresa con su AI (`crearAI`, `vincularAI`)

## Técnico / infraestructura

- [x] Reestructurar a `src/` (`domain/`, `services/`, `fixtures/`)
- [x] Sacar `obtenerNaciones()` de `Nacion.ts` a un servicio
- [x] Agregar `.gitignore`, `tsconfig.json` (strict) y scripts en `package.json`
- [x] Dejar `tsc --noEmit` y `oxlint` en verde
- [x] Usar `Sueldo` en el cálculo de `Empleado`
- [x] CLI interactiva + `bun run demo`
- [x] Tests del dominio (`bun test`)
- [x] API HTTP con Elysia (`src/server/`)
- [x] UI web base (React 19 + Vite + TailwindCSS v4, `web/`)

## Pendiente

- [~] UI: edición de capital/acciones (la **vista en vivo** ya está por SSE; falta editar)
- [ ] Mercado con libro de órdenes real (hoy el precio lo fija una fórmula)
- [ ] Inflación, tasas y banco central (el PIB es nominal)
- [ ] Leyes que afecten el PIB y los recursos (hoy afectan sueldos, propiedades y IA)
- [ ] Quiebras y desempleo automáticos
- [ ] Tests del esquema GraphQL e import/export del estado en JSON

## Modelo económico (feat/simulacion-economica-graphql)

- [x] `Recurso` (agua, electricidad, combustible, minerales) con disponibilidad y precio
- [x] `Ambiente` (contaminación, calidad de aire, temperatura, biodiversidad)
- [x] `Economia` con PIB global, productividad global, período e histórico
- [x] Productividad por empresa + productividad global que escala todos los sueldos
- [x] `Accion` y `Mercado`: capitalización, índice y reprecio por período
- [x] Adquisición de empresas (empresa o IA, con prima del 20%)
- [x] `services/simulacion.ts`: ciclo por período (producción → recursos → ambiente → productividad → PIB → mercado)
- [x] API migrada a **GraphQL** (`graphql-yoga` sobre Elysia) con GraphiQL
- [x] Persistencia en **SQLite** con semilla para `reiniciar`
- [x] UI: pestañas Economía, Mercado y Recursos (con sparklines propias)
- [x] `serve` sirve la UI y la API en el mismo puerto

## Simulación en vivo y modelo realista (issues #21+)

Plan completo y dependencias: [issues.md](./issues.md).

### Épica A — Simulación en tiempo real

- [x] Reloj en el servidor con play/pausa, velocidad y períodos/tick (`server/reloj.ts`)
- [x] Bus de eventos + stream SSE `GET /api/stream` (`server/eventos.ts`, `server/app.ts`)
- [x] UI en vivo: barra de control + `EventSource` que actualiza el mundo sin refrescar
- [x] Predicción por simulación aislada (`services/prediccion.ts`, query `predecir`)
- [x] Tests de predicción y del bus de eventos (`tests/prediccion.test.ts`)

### Épicas B–F — Modelo realista (pendiente)

- [ ] B — Empresa: sector, objetivo, empleados productivos y productividad combinada
- [ ] C — IA: catálogo de modelos con curva, adopción y AIs rogue
- [ ] D — Empresas estatales y provisión de recursos
- [ ] E — Clientes, cuota de mercado y beneficio
- [ ] F — Exposición GraphQL, persistencia, UI y docs del modelo ampliado
