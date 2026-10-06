import Ley from "./Ley";
import type Estado from "./Estado";
import { fechaId, idAleatorio } from "./identificadores";

class LeyEstatal extends Ley {
  estado: Estado[];

  constructor(nombre: string, descripcion: string, estado: Estado) {
    super(nombre, descripcion, estado.nacion);
    this.estado = [estado];
    // Formato: <iniciales nación>-<iniciales estado>-<fecha>-<id>  (ej: US-CA-2026-10-06-k3f9a1).
    this.id = `${estado.nacion.iniciales}-${estado.iniciales}-${fechaId()}-${idAleatorio()}`;
  }
}

export default LeyEstatal;
