import type Empleado from "../domain/Empleado";
import type Ley from "../domain/Ley";

interface LineaNomina {
  id: number;
  nombre: string;
  tipo: string;
  tipoSueldo: string;
  sueldoBase: number;
  factorLeyes: number;
  factorProductividad: number;
  sueldoFinal: number;
}

/**
 * Recorre los empleados y calcula el sueldo de cada uno (polimorfismo),
 * incluyendo las leyes que le aplican y la productividad global.
 */
function calcularNomina(
  empleados: Empleado[],
  leyesGlobales: Ley[] = [],
  productividadGlobal: number = 1,
): LineaNomina[] {
  return empleados.map((empleado) => {
    const base = empleado.calcularSueldo();
    const final = empleado.sueldoConLeyes(leyesGlobales, productividadGlobal);
    return {
      id: empleado.id,
      nombre: empleado.nombre,
      tipo: empleado.constructor.name,
      tipoSueldo: empleado.tipoSueldo(),
      sueldoBase: base,
      factorLeyes:
        base === 0 ? 0 : Number((final.monto / base / productividadGlobal - 1).toFixed(6)),
      factorProductividad: productividadGlobal,
      sueldoFinal: final.monto,
    };
  });
}

/** Suma de los sueldos base (sin leyes ni productividad) de toda la nómina. */
function totalNomina(empleados: Empleado[]): number {
  return empleados.reduce((total, empleado) => total + empleado.calcularSueldo(), 0);
}

/** Suma de los sueldos finales (con leyes y productividad aplicadas). */
function totalNominaFinal(
  empleados: Empleado[],
  leyesGlobales: Ley[] = [],
  productividadGlobal: number = 1,
): number {
  return empleados.reduce(
    (total, empleado) => total + empleado.sueldoConLeyes(leyesGlobales, productividadGlobal).monto,
    0,
  );
}

/** Formatea un monto como moneda (formato es-AR). */
function formatearMoneda(monto: number): string {
  return `$ ${monto.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

/** Imprime la nómina completa, empleado por empleado, con su total. */
function imprimirNomina(
  empleados: Empleado[],
  leyesGlobales: Ley[] = [],
  productividadGlobal: number = 1,
): void {
  const lineas = calcularNomina(empleados, leyesGlobales, productividadGlobal);

  if (lineas.length === 0) {
    console.log("No hay empleados en la nómina.");
    return;
  }

  console.log("Nómina:");
  for (const linea of lineas) {
    const leyes =
      linea.factorLeyes === 0
        ? ""
        : ` (leyes ${linea.factorLeyes > 0 ? "+" : ""}${(linea.factorLeyes * 100).toFixed(1)}%)`;
    console.log(
      `  #${linea.id} ${linea.nombre} (${linea.tipo}) → ${formatearMoneda(linea.sueldoFinal)}${leyes}`,
    );
  }
  console.log(`  Sueldo base (total):   ${formatearMoneda(totalNomina(empleados))}`);
  console.log(
    `  Sueldo final (total):  ${formatearMoneda(totalNominaFinal(empleados, leyesGlobales, productividadGlobal))}`,
  );
  console.log(`  Productividad global:  ×${productividadGlobal.toFixed(3)}`);
}

export { calcularNomina, totalNomina, totalNominaFinal, formatearMoneda, imprimirNomina };
export type { LineaNomina };
export default calcularNomina;
