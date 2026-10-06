import Empresa from "../domain/Empresa";
import EmpleadoFijo from "../domain/EmpleadoFijo";
import EmpleadoPorHora from "../domain/EmpleadoPorHora";
import Jefe from "../domain/Jefe";
import Vendedor from "../domain/Vendedor";
import type Empleado from "../domain/Empleado";
import { california } from "./estadosBase";
import { nacionPrincipal } from "./nacionesBase";

const empresaDemo = new Empresa("Empresa Demo", 1, [], 5_000_000, [], {
  nacion: nacionPrincipal,
  estado: california,
  productividad: 1,
  acciones: 50_000,
  intensidadEmision: 0.5,
});

const ana = new EmpleadoFijo("Ana Fija", 1, empresaDemo);
const beto = new EmpleadoPorHora("Beto PorHora", 2, empresaDemo, 160, 2500);
const carla = new Vendedor("Carla Vendedora", 3, empresaDemo, 30000, 500000, 5);
const dora = new Jefe(80_000, "Dora Jefa", 4, empresaDemo, "Operaciones");

const empleadosDemo: Empleado[] = [ana, beto, carla, dora];

for (const empleado of empleadosDemo) empresaDemo.contratar(empleado);
empresaDemo.designarJefe(dora);
for (const empleado of [ana, beto, carla]) dora.supervisar(empleado);

export { empresaDemo, dora as jefeDemo };
export default empleadosDemo;
