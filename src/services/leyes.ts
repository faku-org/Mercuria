import type Ley from "../domain/Ley";
import type { ObjetivoLey } from "../domain/Ley";
import { factorLeyesGlobales } from "../domain/Ley";
import type Nacion from "../domain/Nacion";

/**
 * Factor total de leyes que aplica a una ubicación (nación o estado) para un
 * objetivo: leyes locales + leyes globales vigentes.
 */
function factorTotal(
  ubicacion: Nacion | undefined,
  objetivo: ObjetivoLey,
  leyesGlobales: Ley[] = [],
): number {
  const local = ubicacion?.factorLeyes(objetivo) ?? 0;
  return local + factorLeyesGlobales(leyesGlobales, objetivo);
}

/** Filtra las leyes activas, opcionalmente por objetivo. */
function leyesActivas(leyes: Ley[], objetivo?: ObjetivoLey): Ley[] {
  return leyes.filter((ley) => ley.activa && (objetivo === undefined || ley.objetivo === objetivo));
}

/**
 * Resume el efecto de un conjunto de leyes: cantidad, y factor total por objetivo.
 */
function resumenLeyes(leyes: Ley[]): {
  total: number;
  activas: number;
  factores: Record<ObjetivoLey, number>;
} {
  const factores: Record<ObjetivoLey, number> = {
    sueldo: 0,
    empresa: 0,
    propiedad: 0,
    ai: 0,
  };

  for (const ley of leyesActivas(leyes)) {
    factores[ley.objetivo] += ley.factor();
  }

  return {
    total: leyes.length,
    activas: leyesActivas(leyes).length,
    factores,
  };
}

export { factorTotal, leyesActivas, resumenLeyes };
export default factorTotal;
