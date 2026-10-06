import Empleado from "./Empleado";
import type Empresa from "./Empresa";

class Jefe extends Empleado {
  departamento: string;
  equipo: Empleado[];

  constructor(sueldo: number, nombre: string, id: number, empresa: Empresa, departamento: string) {
    super(sueldo, nombre, id, empresa);
    this.departamento = departamento;
    this.equipo = [];
  }

  /** Suma un empleado al equipo a cargo del jefe (sin duplicados). */
  supervisar(empleado: Empleado): void {
    if (empleado !== this && !this.equipo.includes(empleado)) {
      this.equipo.push(empleado);
    }
  }

  /** Saca a un empleado del equipo. */
  desvincular(empleado: Empleado): void {
    this.equipo = this.equipo.filter((integrante) => integrante !== empleado);
  }

  /** Sueldo base que cuesta el equipo completo (incluyendo al jefe). */
  costoEquipo(): number {
    return this.equipo.reduce((total, empleado) => total + empleado.calcularSueldo(), 0);
  }
}

export default Jefe;
