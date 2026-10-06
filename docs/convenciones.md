# Convenciones

Reglas para escribir y ubicar código en este proyecto. El objetivo es que cualquiera
sepa dónde va una cosa nueva sin preguntar.

## Lenguaje y herramientas

- **TypeScript** en modo `strict` (ver `tsconfig.json`). No usar `any` implícito.
- **Bun** ejecuta y compila. No hay paso de build: se corre el `.ts` directo.
- **oxlint** para lint y **oxfmt** para formato. Antes de dar algo por terminado:

  ```bash
  bun run check   # tipos
  bun run lint    # lint
  bun run format  # formato
  ```

## Nombres de archivos

| Tipo de módulo                   | Convención                          | Ejemplo                        |
| -------------------------------- | ----------------------------------- | ------------------------------ |
| Clase del dominio                | `PascalCase.ts`, igual que la clase | `Empleado.ts`, `LeyEstatal.ts` |
| Módulo de servicios / utilidades | `camelCase.ts`                      | `naciones.ts`                  |
| Datos semilla                    | `camelCase.ts`                      | `leyesBase.ts`                 |
| Punto de entrada                 | `index.ts`                          | `src/index.ts`                 |

Evitar nombres como `Main.ts` (casing inconsistente): el entrypoint es `index.ts`.

## Exports

- Un archivo de **una sola clase** la exporta como **`export default`**.
- Un archivo con **varias funciones** (servicios) exporta nombrado y, si hay una
  principal, también `export default`.

```ts
// domain/Ley.ts
class Ley {
  /* ... */
}
export default Ley;

// services/naciones.ts
export { listarNaciones, obtenerNaciones };
export default listarNaciones;
```

## Imports

- Siempre relativos (`./` y `../`). No hay alias configurados.
- Usá `import type` cuando el import es solo un tipo (obligatorio por
  `verbatimModuleSyntax`, y evita ciclos en runtime).
- No importar de `services/` o `fixtures/` dentro de `domain/`.

## Estilo de escritura

- Indentación y formato los resuelve `oxfmt`; no pelear con el formato a mano.
- Un `TODO:` para trabajo pendiente, con referencia al documento:
  `// TODO: modelar efecto de leyes (ver docs/dominio.md).`
- Los archivos placeholder (módulos todavía sin implementar) llevan un comentario
  que indica que están pendientes y dónde está el detalle.

## API y UI

- **API** (`src/server/`): las rutas viven en `app.ts` y los DTOs + acciones en
  `mundo.ts`. El dominio no conoce la API; el mapeo a JSON se hace en `mundo.ts`.
- **UI** (`web/`): no importa código del backend. Sus tipos (`web/src/types.ts`) son
  espejo de los DTOs y se accede por HTTP vía `web/src/api.ts`.
- Iconografía siempre con `lucide-react` (nunca emojis). Paleta neutra con un solo acento.

## Cómo agregar un módulo nuevo (paso a paso)

1. **Modelo**: crear `src/domain/MiClase.ts` con la clase y `export default`.
2. **Datos de prueba** (si hace falta): crear `src/fixtures/misDatos.ts` que
   instancie objetos de `domain/`.
3. **Servicio** (si hay operación sobre el modelo): crear `src/services/miServicio.ts`.
4. **Conectar**: importar y usar desde `src/index.ts`.
5. **Verificar**: `bun run check` y `bun run lint`.
6. **Documentar**: actualizar `docs/dominio.md` y marcar el ítem en `docs/roadmap.md`.
