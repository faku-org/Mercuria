import Empleado from "./Empleado";
import type Empresa from "./Empresa";

/** Sueldo mensual fijo de un empleado fijo. */
const SUELDO_MENSUAL = 50000;

class EmpleadoFijo extends Empleado {
  constructor(nombre: string, id: number, empresa: Empresa) {
    super(SUELDO_MENSUAL, nombre, id, empresa);
  }

  override calcularSueldo(): number {
    return SUELDO_MENSUAL;
  }
}

export { SUELDO_MENSUAL };
export default EmpleadoFijo;
