// CLI interactiva para probar el cálculo polimórfico de sueldos.
// Uso: `bun run start` (interactivo) o `bun run demo` (sin interacción).

import type Empleado from "./domain/Empleado";
import Empresa from "./domain/Empresa";
import EmpleadoFijo, { SUELDO_MENSUAL } from "./domain/EmpleadoFijo";
import EmpleadoPorHora from "./domain/EmpleadoPorHora";
import Vendedor from "./domain/Vendedor";
import { formatearMoneda, imprimirNomina } from "./services/nomina";
import empleadosDemo from "./fixtures/empleadosBase";

const empresa = new Empresa("Empresa Demo", 1, [], 0, []);

let empleados: Empleado[] = [];
let proximoId = 1;
let entradaCerrada = false;

/**
 * Lee una línea de la entrada estándar. Devuelve "" al llegar al EOF (Ctrl+D).
 */
function pedirLinea(mensaje: string): string {
  if (entradaCerrada) return "";
  const valor = prompt(mensaje);
  if (valor === null) {
    entradaCerrada = true;
    return "";
  }
  return valor.trim();
}

/**
 * Pide un número mayor o igual a `minimo`, repitiendo hasta obtener uno válido.
 */
function pedirNumero(mensaje: string, minimo = 0): number {
  let numero = Number.NaN;
  while (!entradaCerrada && (Number.isNaN(numero) || numero < minimo)) {
    const valor = pedirLinea(mensaje);
    if (entradaCerrada && valor === "") break;
    numero = Number(valor.replace(",", "."));
    if (Number.isNaN(numero) || numero < minimo) {
      console.log(`  Ingresá un número válido (>= ${minimo}).`);
    }
  }
  return Number.isNaN(numero) ? 0 : numero;
}

function registrar(empleado: Empleado, nombre: string): void {
  proximoId += 1;
  empleados.push(empleado);
  console.log(`Empleado "${nombre}" agregado.`);
}

function verNomina(): void {
  imprimirNomina(empleados);
}

function siguienteId(lista: Empleado[]): number {
  return lista.reduce((maximo, empleado) => Math.max(maximo, empleado.id), 0) + 1;
}

function cargarDemo(): void {
  empleados = [...empleadosDemo];
  proximoId = siguienteId(empleados);
  console.log("Nómina de ejemplo cargada.");
  verNomina();
}

function crearEmpleado(): void {
  console.log("Tipo de empleado:");
  console.log(`  1) Fijo (sueldo mensual ${formatearMoneda(SUELDO_MENSUAL)})`);
  console.log("  2) Por hora (horas × tarifa)");
  console.log("  3) Vendedor (sueldo base + comisión)");

  const tipo = pedirLinea("Tipo: ");
  if (entradaCerrada) return;

  const nombre = pedirLinea("Nombre: ");
  if (nombre.length === 0) {
    console.log("Nombre vacío: cancelado.");
    return;
  }

  const id = proximoId;

  if (tipo === "1") {
    registrar(new EmpleadoFijo(nombre, id, empresa), nombre);
  } else if (tipo === "2") {
    const horas = pedirNumero("Horas trabajadas: ");
    const tarifa = pedirNumero("Tarifa por hora: ");
    registrar(new EmpleadoPorHora(nombre, id, empresa, horas, tarifa), nombre);
  } else if (tipo === "3") {
    const base = pedirNumero("Sueldo base: ");
    const ventas = pedirNumero("Total de ventas: ");
    const comision = pedirNumero("Comisión (%): ");
    registrar(new Vendedor(nombre, id, empresa, base, ventas, comision), nombre);
  } else {
    console.log("Tipo inválido: cancelado.");
  }
}

function iniciarCLI(): void {
  console.log("=== Polimorfismo · Nómina ===");

  let salir = false;
  while (!salir) {
    console.log("");
    console.log("1) Cargar nómina de ejemplo (datos demo)");
    console.log("2) Crear empleado");
    console.log("3) Ver nómina actual");
    console.log("4) Vaciar nómina");
    console.log("0) Salir");

    const opcion = pedirLinea("Opción: ");
    if (entradaCerrada) break;

    switch (opcion) {
      case "1":
        cargarDemo();
        break;
      case "2":
        crearEmpleado();
        break;
      case "3":
        verNomina();
        break;
      case "4":
        empleados = [];
        proximoId = 1;
        console.log("Nómina vaciada.");
        break;
      case "0":
        salir = true;
        break;
      default:
        console.log("Opción inválida.");
    }
  }

  console.log("¡Hasta luego!");
}

function obtenerArgv(): string[] {
  const contenedor = globalThis as { process?: { argv?: string[] } };
  return contenedor.process?.argv ?? [];
}

function main(): void {
  if (obtenerArgv().includes("--demo")) {
    console.log("=== Polimorfismo · Demo de nómina ===");
    imprimirNomina(empleadosDemo);
    return;
  }

  iniciarCLI();
}

export { iniciarCLI, cargarDemo, verNomina, crearEmpleado };
export default main;
