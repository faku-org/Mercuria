import Nacion from "./Nacion";
import type LeyEstatal from "./LeyEstatal";
import { idAleatorio } from "./identificadores";

class Estado extends Nacion {
  override leyes: LeyEstatal[];
  nacion: Nacion;

  constructor(nombre: string, capital: string, idioma: string, poblacion: number, nacion: Nacion) {
    super(nombre, capital, idioma, poblacion);
    this.nacion = nacion;
    // El id del estado usa las iniciales de su nación: <Nacion iniciales>-<id>.
    this.id = `${nacion.iniciales}-${idAleatorio()}`;
    this.leyes = [];
  }
}

export default Estado;
