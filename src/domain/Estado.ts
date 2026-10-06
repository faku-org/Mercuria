import Nacion from "./Nacion";
import type LeyEstatal from "./LeyEstatal";
import type { ObjetivoLey } from "./Ley";
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

  /** Leyes estatales activas que afectan a un objetivo. */
  leyesEstatalesDe(objetivo: ObjetivoLey): LeyEstatal[] {
    return this.leyes.filter((ley) => ley.activa && ley.objetivo === objetivo);
  }

  /**
   * Prioridad de leyes: si el estado tiene leyes activas para el objetivo, mandan
   * las del estado; si no, se hereda el factor de la nación.
   */
  override factorLeyes(objetivo: ObjetivoLey): number {
    const propias = this.leyesEstatalesDe(objetivo);
    if (propias.length > 0) {
      return propias.reduce((factor, ley) => factor + ley.factor(), 0);
    }
    return this.nacion.factorLeyes(objetivo);
  }
}

export default Estado;
