import type Empleado from "./Empleado";

class Empresa {
  nombre: string;
  id: number;
  empleados: Empleado[];
  capital: number;
  propiedades: string[];

  constructor(
    nombre: string,
    id: number,
    empleados: Empleado[],
    capital: number,
    propiedades: string[],
  ) {
    this.nombre = nombre;
    this.id = id;
    this.empleados = empleados;
    this.capital = capital;
    this.propiedades = propiedades;
  }
}

export default Empresa;
