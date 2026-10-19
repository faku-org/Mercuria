import { CAMPOS_TECNOLOGICOS, VALORES, afinidad } from "../domain/contratosTecnologia";
import type { Aleatorio, CampoTecnologico, VectorValores } from "../domain/contratosTecnologia";
import Investigador from "../domain/Investigador";

/**
 * Constantes de calibración (propuestas de arranque, ver docs/tecnologia.md sección 4).
 * - PROBABILIDAD_APARICION: probabilidad por ciclo de que surja un investigador espontáneo.
 *   Debe quedar por debajo de la del descubrimiento por inversión (épica I).
 * - HABILIDAD_MIN / HABILIDAD_MAX: rango de habilidad de los que aparecen.
 * - BETA: peso de la afinidad en la oferta efectiva (0 = solo importa la plata).
 * - FACTOR_RESERVA: el sueldo de reserva es esta fracción de su sueldo de mercado.
 * - FRACCION_COSTO_CAMBIO: costo de cambiar de empleador, como fracción de la reserva.
 * - MARGEN_OFERTA: sobreprecio mínimo con que `decidirOferta` supera el umbral.
 */
const PROBABILIDAD_APARICION = 0.002;
const HABILIDAD_MIN = 0.1;
const HABILIDAD_MAX = 1;
const BETA = 0.5;
const FACTOR_RESERVA = 0.9;
const FRACCION_COSTO_CAMBIO = 0.15;
const MARGEN_OFERTA = 0.02;

interface ParametrosAparicion {
  probabilidad?: number;
  habilidadMin?: number;
  habilidadMax?: number;
  nombre?: string;
}

/**
 * Con probabilidad por ciclo, hace aparecer un investigador independiente con campo,
 * habilidad y personalidad aleatorios. Con la misma semilla da siempre el mismo resultado.
 * Si no aparece, consume un solo valor del generador.
 */
function generarInvestigadorEspontaneo(
  aleatorio: Aleatorio,
  params: ParametrosAparicion = {},
): Investigador | null {
  const probabilidad = params.probabilidad ?? PROBABILIDAD_APARICION;
  if (aleatorio.siguiente() >= probabilidad) return null;

  const habilidadMin = params.habilidadMin ?? HABILIDAD_MIN;
  const habilidadMax = params.habilidadMax ?? HABILIDAD_MAX;
  const indiceCampo = Math.floor(aleatorio.siguiente() * CAMPOS_TECNOLOGICOS.length);
  const campo = CAMPOS_TECNOLOGICOS[indiceCampo] ?? CAMPOS_TECNOLOGICOS[0];
  const habilidad = habilidadMin + aleatorio.siguiente() * (habilidadMax - habilidadMin);
  const personalidad = Object.fromEntries(
    VALORES.map((valor) => [valor, aleatorio.siguiente()]),
  ) as VectorValores;
  return new Investigador(params.nombre ?? "Investigador", campo, habilidad, personalidad);
}

/**
 * Suma de habilidad de los investigadores: lo que se agrega a la inversión efectiva.
 * Si se indica `campo`, solo cuentan los de ese campo. Nunca baja al sumar un investigador.
 */
function aporteDeInversion(investigadores: Investigador[], campo?: CampoTecnologico): number {
  let suma = 0;
  for (const investigador of investigadores) {
    if (campo === undefined || investigador.campo === campo) suma += investigador.habilidad;
  }
  return suma;
}

/** Oferta ajustada por afinidad: sueldoOfrecido x (1 + beta x afinidad). */
function ofertaEfectiva(
  sueldoOfrecido: number,
  personalidad: VectorValores,
  valoresEmpresa: VectorValores,
  beta: number = BETA,
): number {
  return sueldoOfrecido * (1 + beta * afinidad(personalidad, valoresEmpresa));
}

/** Lo mínimo que acepta cobrar: una fracción de su sueldo de mercado. */
function sueldoDeReserva(investigador: Investigador): number {
  return investigador.calcularSueldo() * FACTOR_RESERVA;
}

/** Costo de dejar su empleador actual. Un independiente no tiene nada que dejar. */
function costoDeCambio(investigador: Investigador): number {
  if (investigador.esIndependiente()) return 0;
  return sueldoDeReserva(investigador) * FRACCION_COSTO_CAMBIO;
}

interface Oferta {
  empresa: string;
  sueldoOfrecido: number;
  valoresEmpresa: VectorValores;
}

interface ResultadoSubasta {
  /** Nombre de la empresa ganadora, o `null` si ninguna superó el umbral. */
  ganador: string | null;
  /** Sueldo que pagará el ganador (su oferta nominal; first-price). 0 si no hay ganador. */
  precio: number;
  ofertaEfectiva: number;
}

/** Umbral que una oferta debe superar. Al empleador actual no se le suma el costo de cambio. */
function umbralDe(investigador: Investigador, empresa: string): number {
  const reserva = sueldoDeReserva(investigador);
  return empresa === investigador.empleador ? reserva : reserva + costoDeCambio(investigador);
}

/**
 * Una subasta por período. Gana la mayor oferta efectiva que supere el umbral (reserva, más
 * el costo de cambio si la empresa no es la actual). El empleador actual compite con la misma
 * fórmula; el costo de cambio es lo que lo protege. En empate gana la oferta que aparece primero.
 */
function subastar(
  investigador: Investigador,
  ofertas: Oferta[],
  beta: number = BETA,
): ResultadoSubasta {
  let mejor: ResultadoSubasta = { ganador: null, precio: 0, ofertaEfectiva: 0 };
  for (const oferta of ofertas) {
    if (!Number.isFinite(oferta.sueldoOfrecido) || oferta.sueldoOfrecido <= 0) continue;
    const efectiva = ofertaEfectiva(
      oferta.sueldoOfrecido,
      investigador.personalidad,
      oferta.valoresEmpresa,
      beta,
    );
    if (efectiva <= umbralDe(investigador, oferta.empresa)) continue;
    if (mejor.ganador === null || efectiva > mejor.ofertaEfectiva) {
      mejor = { ganador: oferta.empresa, precio: oferta.sueldoOfrecido, ofertaEfectiva: efectiva };
    }
  }
  return mejor;
}

interface ParametrosDecision {
  investigador: Investigador;
  empresa: string;
  valoresEmpresa: VectorValores;
  /** Máximo sueldo nominal que la empresa está dispuesta a pagar. */
  presupuesto: number;
  /** Mejor oferta efectiva de un rival (0 si no hay). */
  mejorRival?: number;
  beta?: number;
  margen?: number;
}

/**
 * PROVISORIO: decide cuánto ofertar. Ofrece lo justo para superar el umbral y al mejor rival
 * (con un margen) y devuelve `null` si el presupuesto no alcanza. Cuando exista el objetivo de
 * empresa (épica B2) esta decisión pasa a depender de él; la firma puede cambiar.
 */
function decidirOferta(params: ParametrosDecision): number | null {
  const beta = params.beta ?? BETA;
  const margen = params.margen ?? MARGEN_OFERTA;
  const factor = 1 + beta * afinidad(params.investigador.personalidad, params.valoresEmpresa);
  const objetivo = Math.max(umbralDe(params.investigador, params.empresa), params.mejorRival ?? 0);
  const sueldo = (objetivo / factor) * (1 + margen);
  return sueldo <= params.presupuesto ? sueldo : null;
}

export {
  BETA,
  FACTOR_RESERVA,
  FRACCION_COSTO_CAMBIO,
  PROBABILIDAD_APARICION,
  aporteDeInversion,
  costoDeCambio,
  decidirOferta,
  generarInvestigadorEspontaneo,
  ofertaEfectiva,
  subastar,
  sueldoDeReserva,
  type Oferta,
  type ParametrosAparicion,
  type ParametrosDecision,
  type ResultadoSubasta,
};
export default subastar;
