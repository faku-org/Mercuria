import Empleado from "./Empleado";
import type Empresa from "./Empresa";

class Vendedor extends Empleado {
  ventas: number;
  porcentajeComision: number;

  constructor(
    nombre: string,
    id: number,
    empresa: Empresa,
    sueldoBase: number,
    ventas: number,
    porcentajeComision: number,
  ) {
    super(sueldoBase, nombre, id, empresa);
    this.ventas = ventas;
    this.porcentajeComision = porcentajeComision;
  }

  override calcularSueldo(): number {
    return this.sueldo + this.ventas * (this.porcentajeComision / 100);
  }
}

export default Vendedor;
