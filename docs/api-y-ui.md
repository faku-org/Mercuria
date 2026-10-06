# API y UI

El backend expone el dominio por HTTP (`src/server/`) y la UI (`web/`) lo consume. Todo
el mundo vive **en memoria**: los datos salen de `src/fixtures/` y se mutan con las
acciones; `POST /api/reiniciar` restaura el estado inicial.

```bash
bun run serve     # API en http://localhost:3011
bun run web:dev   # UI en http://localhost:3010 (proxy /api → 3011)
```

## Endpoints

| Método | Ruta                           | Descripción                                         |
| ------ | ------------------------------ | --------------------------------------------------- |
| GET    | `/api/salud`                   | Health check.                                       |
| GET    | `/api/mundo`                   | Estado completo (naciones, leyes, nómina, IA, ...). |
| GET    | `/api/nomina`                  | Solo la nómina (líneas + totales).                  |
| POST   | `/api/empleados`               | Crea un empleado.                                   |
| POST   | `/api/leyes/:id/toggle`        | Activa/desactiva una ley.                           |
| POST   | `/api/propiedades/:id/comprar` | La empresa compra una propiedad.                    |
| POST   | `/api/agentes`                 | Asigna un agente a la IA.                           |
| POST   | `/api/reiniciar`               | Restaura los datos iniciales.                       |

### Cuerpos

```jsonc
// POST /api/empleados
{ "tipo": "fijo" | "porHora" | "vendedor" | "jefe", "nombre": "Ana",
  "horasTrabajadas": 160, "tarifaPorHora": 2500,     // porHora
  "sueldoBase": 30000, "ventas": 500000, "porcentajeComision": 5, "sueldo": 80000 }

// POST /api/agentes
{ "nombre": "Orion Soporte", "modelo": "Claude 3.5", "sector": "soporte", "productividad": 0.9 }
```

Códigos: `201` al crear, `404` si la ley no existe, `409` si la compra no se puede pagar.

## UI

`web/` es un panel de lectura con acciones puntuales. Pestañas:

| Pestaña      | Muestra                                                             |
| ------------ | ------------------------------------------------------------------- |
| Nómina       | Sueldo base, factor de leyes y sueldo final por empleado + totales. |
| Naciones     | Naciones y estados con capital, idioma, población y sus leyes.      |
| Leyes        | Efecto, magnitud y alcance de cada ley; botón activar/desactivar.   |
| Propiedades  | Precio con leyes, ubicación, dueño y botón de compra.               |
| Empresas     | Capital, ubicación, jefe, plantilla, propiedades e IA.              |
| IA y agentes | Sueldo de la IA, agentes por sector, costo de uso y alta de agente. |

Stack: React 19 + Vite + TailwindCSS v4 + `lucide-react`. Estilo: paleta neutra con un
solo acento (`--color-accent`), sin degradados.

## Ideas para seguir

- Persistencia (SQLite o JSON en disco) en vez de estado en memoria.
- Edición en la UI (sueldos, capital, leyes) además de las acciones actuales.
- Gráficos de impacto de leyes por objetivo.
- Tests de los endpoints (Bun + `app.handle`).
