import type Empleado from "../domain/Empleado";
import type Ley from "../domain/Ley";

interface LineaNomina {
  id: number;
  nombre: string;
  tipo: string;
  tipoSueldo: string;
  sueldoBase: number;
  factorLeyes: number;
  sueldoFinal: number;
}

/**
 * Recorre los empleados y calcula el sueldo de cada uno (polimorfismo),
 * incluyendo el efecto de las leyes que le aplican.
 */
function calcularNomina(empleados: Empleado[], leyesGlobales: Ley[] = []): LineaNomina[] {
  return empleados.map((empleado) => {
    const base = empleado.calcularSueldo();
    const final = empleado.sueldoConLeyes(leyesGlobales);
    return {
      id: empleado.id,
      nombre: empleado.nombre,
      tipo: empleado.constructor.name,
      tipoSueldo: empleado.tipoSueldo(),
      sueldoBase: base,
      factorLeyes: base === 0 ? 0 : Number((final.monto / base - 1).toFixed(6)),
      sueldoFinal: final.monto,
    };
  });
}

/** Suma de los sueldos base (sin leyes) de toda la nómina. */
function totalNomina(empleados: Empleado[]): number {
  return empleados.reduce((total, empleado) => total + empleado.calcularSueldo(), 0);
}

/** Suma de los sueldos finales (con leyes aplicadas). */
function totalNominaFinal(empleados: Empleado[], leyesGlobales: Ley[] = []): number {
  return empleados.reduce(
    (total, empleado) => total + empleado.sueldoConLeyes(leyesGlobales).monto,
    0,
  );
}

/** Formatea un monto como moneda (formato es-AR). */
function formatearMoneda(monto: number): string {
  return `$ ${monto.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

/** Imprime la nómina completa, empleado por empleado, con su total. */
function imprimirNomina(empleados: Empleado[], leyesGlobales: Ley[] = []): void {
  const lineas = calcularNomina(empleados, leyesGlobales);

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
  console.log(`  Total base:  ${formatearMoneda(totalNomina(empleados))}`);
  console.log(`  Total final: ${formatearMoneda(totalNominaFinal(empleados, leyesGlobales))}`);
}

export { calcularNomina, totalNomina, totalNominaFinal, formatearMoneda, imprimirNomina };
export type { LineaNomina };
export default calcularNomina;
