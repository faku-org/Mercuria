import Empresa from "../domain/Empresa";
import EmpleadoFijo from "../domain/EmpleadoFijo";
import EmpleadoPorHora from "../domain/EmpleadoPorHora";
import Vendedor from "../domain/Vendedor";
import type Empleado from "../domain/Empleado";

const empresaDemo = new Empresa("Empresa Demo", 1, [], 5000000, []);

const empleadosDemo: Empleado[] = [
  new EmpleadoFijo("Ana Fija", 1, empresaDemo),
  new EmpleadoPorHora("Beto PorHora", 2, empresaDemo, 160, 2500),
  new Vendedor("Carla Vendedora", 3, empresaDemo, 30000, 500000, 5),
];

export { empresaDemo };
export default empleadosDemo;
