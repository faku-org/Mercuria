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
}

export default Jefe;
