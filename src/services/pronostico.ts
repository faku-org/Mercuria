// Pronóstico de la empresa: el usuario ve lo que su empresa PRONOSTICA, no la verdad.
//
//   pronóstico(h) = real(h) × (1 + ε),  ε ~ Normal(0, σ(h))
//   σ(h) = σ0 × √h × (1 − efectoEfectivo)^p
//
// El error de cada horizonte es independiente. El nivel de procesamiento entra como
// número (efecto en [0, 1]). Ver docs/tecnologia.md, sección 7.

import type { Aleatorio } from "../domain/contratosTecnologia";
import { efectoDeComputo } from "./computo";
import { normal } from "./aleatorio";

// Constantes de calibración (propuestas de arranque, se ajustan con tests).
/** Desvío relativo por raíz de período con procesamiento nulo. */
const SIGMA0 = 0.02;
/** Exponente con que el procesamiento efectivo baja el desvío. */
const P_PROCESAMIENTO = 1.5;

interface ParametrosPronostico {
  /** Efecto propio del procesamiento de la empresa, en [0, 1]. */
  efectoProcesamiento: number;
  /** Unidades de cómputo alquiladas (0 si no alquila). */
  unidadesAlquiladas?: number;
  sigma0?: number;
  p?: number;
}

function acotar01(x: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));
}

/** El mayor entre el efecto propio y el que aporta el cómputo alquilado. */
function efectoProcesamientoEfectivo(params: ParametrosPronostico): number {
  return Math.max(
    acotar01(params.efectoProcesamiento),
    acotar01(efectoDeComputo(params.unidadesAlquiladas ?? 0)),
  );
}

/** σ(h): desvío relativo del pronóstico a `horizonte` períodos. 0 si h <= 0. */
function desvioPronostico(horizonte: number, params: ParametrosPronostico): number {
  if (!(horizonte > 0)) return 0;
  const sigma0 = params.sigma0 ?? SIGMA0;
  const p = params.p ?? P_PROCESAMIENTO;
  return sigma0 * Math.sqrt(horizonte) * (1 - efectoProcesamientoEfectivo(params)) ** p;
}

/**
 * Pronóstico de una serie real futura. `serieReal[i]` corresponde al horizonte h = i + 1.
 * Consume un `normal()` por elemento, en orden, así que es reproducible con semilla.
 */
function pronosticar(
  serieReal: number[],
  params: ParametrosPronostico,
  aleatorio: Aleatorio,
): number[] {
  return serieReal.map((real, i) => {
    const epsilon = desvioPronostico(i + 1, params) * normal(aleatorio);
    return real * (1 + epsilon);
  });
}

interface BandaPercentil {
  percentil: number;
  /** Valor del percentil en cada horizonte. */
  valores: number[];
}

/** Percentil `q` (0 a 100) de una muestra ordenada, con interpolación lineal. */
function percentilOrdenado(ordenada: number[], q: number): number {
  const posicion = (q / 100) * (ordenada.length - 1);
  const abajo = Math.floor(posicion);
  const arriba = Math.ceil(posicion);
  const a = ordenada[abajo] as number;
  const b = ordenada[arriba] as number;
  return a + (b - a) * (posicion - abajo);
}

/**
 * Percentiles por horizonte de N trayectorias (una por corrida). Los percentiles van
 * de 0 a 100. El largo de las bandas es el de la trayectoria más corta.
 */
function bandasDeEscenarios(trayectorias: number[][], percentiles: number[]): BandaPercentil[] {
  for (const q of percentiles) {
    if (!(q >= 0 && q <= 100)) throw new RangeError(`Percentil fuera de [0, 100]: ${q}`);
  }
  const largo = trayectorias.length === 0 ? 0 : Math.min(...trayectorias.map((t) => t.length));
  return percentiles.map((percentil) => ({
    percentil,
    valores: Array.from({ length: largo }, (_, h) => {
      const muestra = trayectorias.map((t) => t[h] as number).sort((x, y) => x - y);
      return percentilOrdenado(muestra, percentil);
    }),
  }));
}

export {
  bandasDeEscenarios,
  desvioPronostico,
  efectoProcesamientoEfectivo,
  pronosticar,
  type BandaPercentil,
  type ParametrosPronostico,
};
export default pronosticar;
