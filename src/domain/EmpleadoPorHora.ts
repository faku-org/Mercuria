import Empleado from "./Empleado";
import type Empresa from "./Empresa";

class EmpleadoPorHora extends Empleado {
  horasTrabajadas: number;
  tarifaPorHora: number;

  constructor(
    nombre: string,
    id: number,
    empresa: Empresa,
    horasTrabajadas: number,
    tarifaPorHora: number,
  ) {
    super(0, nombre, id, empresa);
    this.horasTrabajadas = horasTrabajadas;
    this.tarifaPorHora = tarifaPorHora;
  }

  override calcularSueldo(): number {
    return this.horasTrabajadas * this.tarifaPorHora;
  }
}

export default EmpleadoPorHora;
