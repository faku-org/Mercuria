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
   * Sueldo final: base × (1 + leyes de su empresa y globales) × productividad global.
   * El efecto de la productividad es global: la misma para todos los empleados.
   */
  sueldoConLeyes(leyesGlobales: Ley[] = [], productividadGlobal: number = 1): Sueldo {
    const factorLeyes = this.empresa.factorLeyes("sueldo", leyesGlobales);
    return this.sueldoDetallado().conLeyes(factorLeyes).escalar(productividadGlobal);
  }
}

export default Empleado;
