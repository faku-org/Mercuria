import type Empresa from "./Empresa";
import Persona from "./Persona";

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
}

export default Empleado;
