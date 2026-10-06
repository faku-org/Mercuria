import type Empresa from "./Empresa";
import type Ley from "./Ley";
import Persona from "./Persona";
import Sueldo from "./Sueldo";
import type { TipoSueldo } from "./Sueldo";

class Empleado extends Persona {
  sueldo: number;
  id: number;
  empresa: Empresa;

  constructor(sueldo: number, nombre: string, id: number, empresa: Empresa) {
    super(nombre, 0, "", new Date(), "", "", true);
    this.sueldo = sueldo;
    this.id = id;
    this.empresa = empresa;
  }

  /**
   * Sueldo base del empleado. Cada subclase lo sobrescribe con su propia regla.
   */
  calcularSueldo(): number {
    return this.sueldo;
  }

  /** Naturaleza del sueldo. Las subclases variables lo sobrescriben. */
  tipoSueldo(): TipoSueldo {
    return "fijo";
  }

  /** Sueldo base representado como objeto de dominio. */
  sueldoDetallado(): Sueldo {
    return new Sueldo(this.calcularSueldo(), false, this.tipoSueldo());
  }

  /**
   * Sueldo final aplicando las leyes del lugar donde trabaja el empleado
   * (nación/estado de su empresa) más las leyes globales vigentes.
   */
  sueldoConLeyes(leyesGlobales: Ley[] = []): Sueldo {
    return this.sueldoDetallado().conLeyes(this.empresa.factorLeyes("sueldo", leyesGlobales));
  }
}

export default Empleado;
