import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import {
  comprarPropiedad,
  crearAgente,
  crearEmpleado,
  mundoDto,
  reiniciar,
  toggleLey,
  type NuevoAgente,
  type NuevoEmpleado,
} from "./mundo";

export function crearApp() {
  return new Elysia()
    .use(cors())
    .onError(({ code, error }) => ({ error: (error as Error).message, code }))
    .get("/api/salud", () => ({ ok: true, servicio: "polimorfismo-api" }))
    .get("/api/mundo", () => mundoDto())
    .get("/api/nomina", () => mundoDto().nomina)
    .post("/api/empleados", ({ body, set }) => {
      const empleado = crearEmpleado((body ?? {}) as NuevoEmpleado);
      set.status = 201;
      return { ok: true, empleado: empleado.nombre };
    })
    .post("/api/leyes/:id/toggle", ({ params, set }) => {
      const ley = toggleLey(params.id);
      if (!ley) {
        set.status = 404;
        return { ok: false, motivo: "Ley inexistente" };
      }
      return { ok: true, id: ley.id, activa: ley.activa };
    })
    .post("/api/propiedades/:id/comprar", ({ params, set }) => {
      const resultado = comprarPropiedad(params.id);
      if (!resultado.ok) set.status = 409;
      return resultado;
    })
    .post("/api/agentes", ({ body, set }) => {
      const agente = crearAgente((body ?? {}) as NuevoAgente);
      set.status = 201;
      return { ok: true, agente: agente.id };
    })
    .post("/api/reiniciar", () => {
      reiniciar();
      return { ok: true };
    });
}
