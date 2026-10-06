import Ley from "./Ley";
import type { OpcionesLey } from "./Ley";
import type Estado from "./Estado";
import { fechaId, idAleatorio } from "./identificadores";

class LeyEstatal extends Ley {
  estado: Estado[];

  constructor(nombre: string, descripcion: string, estado: Estado, opciones: OpcionesLey = {}) {
    super(nombre, descripcion, estado.nacion, { ...opciones, alcance: "estado" });
    this.estado = [estado];
    // Formato: <iniciales nación>-<iniciales estado>-<fecha>-<id>.
    this.id = `${estado.nacion.iniciales}-${estado.iniciales}-${fechaId()}-${idAleatorio()}`;
  }
}

export default LeyEstatal;
