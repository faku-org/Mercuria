# Roadmap

Checklist de trabajo. `[x]` = hecho, `[ ]` = pendiente.

## Requerimientos mínimos

- [x] Empleado fijo: cobra un sueldo mensual de $50.000
- [x] Empleado por hora: cobra según la cantidad de horas trabajadas
- [x] Vendedor: cobra un sueldo base más una comisión por ventas
- [x] Clase `Empleado` con método `calcularSueldo()`
- [x] Tres clases que hereden de `Empleado`:
  - [x] `EmpleadoFijo`
  - [x] `EmpleadoPorHora`
  - [x] `Vendedor`
- [x] Sobrescribir `calcularSueldo()` en cada subclase
- [x] Crear varios empleados de distintos tipos en un mismo array
- [x] Recorrer el array y ejecutar `calcularSueldo()` en cada empleado

## Extras

### Naciones — `domain/Nacion.ts`

- [x] Clase con nombre, id, capital, idioma, población y leyes
- [x] Servicio `obtenerNaciones()` en `services/naciones.ts`
- [ ] Registrar y aplicar las leyes propias de la nación
- [ ] Poblar naciones de prueba en `fixtures/`

### Leyes — `domain/Ley.ts`

- [x] Clase con nombre, id, descripción, `afecta` y `activa`
- [ ] Modelar el efecto (positivo o negativo) y su magnitud
- [ ] Aplicar la ley sobre sueldos, empresas y AI
- [ ] Implementar "afecta a todas las naciones" (hoy `TODO` en el constructor)

### Estados — `domain/Estado.ts`

- [x] Clase que hereda de `Nacion` con leyes de tipo `LeyEstatal`
- [ ] Resolver prioridad entre leyes de nación y de estado
- [x] Asociar cada estado a su nación (`nacion: Nacion`)

### Propiedades — `domain/Propiedad.ts`

- [ ] Clase con nombre, precio, ubicación y dueño
- [ ] Operaciones de compra y venta
- [ ] Aplicar leyes sobre precios y límite de propiedades

### AI — `domain/AI.ts`

- [ ] Entidad con propiedades, empleados y empresas
- [ ] Sueldo de la AI afectado por leyes
- [ ] Validar que una AI siempre fue creada por una empresa

### Agentes — `domain/Agente.ts`

- [ ] Clase con sector asignado
- [ ] Costo de uso según productividad y modelo
- [x] El agente hereda su AI matriz al crearse (`aiMatriz`) y queda registrado en `agentes`
- [ ] Relación AI → sector → agentes

### Identificadores — `domain/identificadores.ts`

- [x] Iniciales automáticas desde el nombre o modelo (`iniciales()`)
- [x] Fecha en formato `YYYY-MM-DD` (`fechaId()`)
- [x] Estado: `<Nacion iniciales>-<id>` (ej: `US-vkvguk`)
- [x] Agente: `<Modelo iniciales>-<id>` (ej: `CL-jel9nm`)
- [x] Ley: `<Nacion iniciales>-<fecha>-<id>` (ej: `US-2026-10-06-6pcm30`)
- [x] LeyEstatal: `<Nacion iniciales>-<Estado iniciales>-<fecha>-<id>` (ej: `US-CA-2026-10-06-9kqf5q`)

### Sueldo — `domain/Sueldo.ts`

- [x] Clase con monto y flag `deduce`
- [x] Exportar la clase
- [ ] Diferenciar sueldo fijo de variable
- [ ] Aplicar leyes de nación/estado al cálculo

### Empresa — `domain/Empresa.ts`

- [x] Clase con nombre, id, empleados, capital y propiedades
- [ ] Tipar `propiedades` como `Propiedad[]` (hoy `string[]`)
- [ ] Jerarquía jefe → equipo de empleados
- [ ] Aplicar leyes de nación/estado
- [ ] Vincular empresa con su AI

## Técnico / infraestructura

- [x] Reestructurar a `src/` (`domain/`, `services/`, `fixtures/`)
- [x] Sacar `obtenerNaciones()` de `Nacion.ts` a un servicio
- [x] Agregar `.gitignore` (node_modules y demás)
- [x] Agregar `tsconfig.json` (strict)
- [x] Agregar scripts en `package.json`
- [x] Corregir imports y ciclos con `import type`
- [x] Dejar `tsc --noEmit` y `oxlint` en verde
- [x] Usar `Sueldo` en el cálculo de `Empleado`
- [x] Armar el caso de uso en `src/index.ts`
- [x] CLI interactiva para crear y listar empleados (`src/cli.ts`)
- [x] Script `bun run demo` con nómina de ejemplo sin interacción
- [ ] (Opcional) agregar tests
- [ ] UI (más adelante)
