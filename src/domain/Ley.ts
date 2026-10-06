import type Nacion from "./Nacion";
import { fechaId, idAleatorio } from "./identificadores";

class Ley {
  nombre: string;
  id: string;
  descripcion: string;
  afecta: Nacion[];
  activa: boolean;

  constructor(nombre: string, descripcion: string, nacion: Nacion) {
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.afecta = [nacion];
    this.activa = false;
    // Formato: <iniciales nación>-<fecha>-<id>  (ej: US-2026-10-06-k3f9a1).
    this.id = `${nacion.iniciales}-${fechaId()}-${idAleatorio()}`;

    // TODO: modelar el concepto de "afecta a todas las naciones" (afecta === "all")
  }
}

export default Ley;
