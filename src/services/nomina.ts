import type Empleado from "../domain/Empleado";

interface LineaNomina {
  id: number;
  nombre: string;
  tipo: string;
  sueldo: number;
}

/**
 * Recorre los empleados y calcula el sueldo de cada uno (polimorfismo).
 */
function calcularNomina(empleados: Empleado[]): LineaNomina[] {
  return empleados.map((empleado) => ({
    id: empleado.id,
    nombre: empleado.nombre,
    tipo: empleado.constructor.name,
    sueldo: empleado.calcularSueldo(),
  }));
}

/**
 * Suma de los sueldos de toda la nómina.
 */
function totalNomina(empleados: Empleado[]): number {
  return empleados.reduce((total, empleado) => total + empleado.calcularSueldo(), 0);
}

/**
 * Formatea un monto como moneda (formato es-AR).
 */
function formatearMoneda(monto: number): string {
  return `$ ${monto.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

/**
 * Imprime la nómina completa, empleado por empleado, con su total.
 */
function imprimirNomina(empleados: Empleado[]): void {
  const lineas = calcularNomina(empleados);

  if (lineas.length === 0) {
    console.log("No hay empleados en la nómina.");
    return;
  }

  console.log("Nómina:");
  for (const linea of lineas) {
    console.log(
      `  #${linea.id} ${linea.nombre} (${linea.tipo}) → ${formatearMoneda(linea.sueldo)}`,
    );
  }
  console.log(`  Total: ${formatearMoneda(totalNomina(empleados))}`);
}

export { calcularNomina, totalNomina, formatearMoneda, imprimirNomina };
export type { LineaNomina };
export default calcularNomina;
