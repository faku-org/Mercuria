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

- [ ] UI: formularios de edición y gráficos (hoy es de lectura + acciones puntuales)
- [ ] Persistencia (hoy el mundo vive en memoria y `POST /api/reiniciar` lo restaura)
- [ ] Leyes con múltiples objetivos a la vez (hoy una ley apunta a un objetivo)
- [ ] Exportar/importar el estado del mundo (JSON)
