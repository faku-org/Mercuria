import type { CampoTecnologico, NivelTecnologico } from "../domain/contratosTecnologia";
import type { Aleatorio } from "../domain/contratosTecnologia";

/*
 * Constantes de calibración (ver docs/tecnologia.md, sección 2). Son propuestas de arranque:
 * los tests de estabilidad de tests/tecnologia.test.ts son los que las validan.
 *
 *   COSTO_BASE[campo]     costo del nivel 1 (en unidades de inversión).
 *   FACTOR_COSTO          el costo de cada nivel nuevo es el anterior x 1,6 (geométrico).
 *   K_EFECTO[campo]       velocidad de saturación del efecto: efecto = 1 - e^(-k n).
 *   LAMBDA                sensibilidad de la probabilidad de descubrir a la inversión.
 *   PROGRESO_NATURAL      probabilidad por ciclo de subir un nivel sin inversión.
 *   NIVEL_TECHO_NATURAL   el progreso natural nunca lleva a un campo más arriba de este nivel.
 *   NIVEL_MAXIMO          tope de seguridad duro. Los costos ya acotan la dinámica; esto
 *                         solo protege contra valores de calibración mal puestos.
 *   DESCUENTO_ENERGIA     cuánto abarata la energía el procesamiento, como máximo (30%).
 *   REBOTE_PROCESAMIENTO  cuánto sube la demanda energética del procesamiento, como máximo.
 *                         Es chico a propósito: el loop Jevons existe, pero está amortiguado.
 */
const COSTO_BASE: Record<CampoTecnologico, number> = {
  energia: 100,
  procesamiento: 120,
  burocracia: 80,
};
const FACTOR_COSTO = 1.6;
const K_EFECTO: Record<CampoTecnologico, number> = {
  energia: 0.25,
  procesamiento: 0.2,
  burocracia: 0.3,
};
const LAMBDA = 0.5;
const PROGRESO_NATURAL = 0.02;
const NIVEL_TECHO_NATURAL = 2;
const NIVEL_MAXIMO = 15;
const DESCUENTO_ENERGIA = 0.3;
const REBOTE_PROCESAMIENTO = 0.15;

/** Niveles de todos los campos de una empresa. */
type NivelesPorCampo = Record<CampoTecnologico, NivelTecnologico>;

interface ResultadoIntento {
  descubierto: boolean;
  probabilidad: number;
}

function exigirNivel(nivel: number): void {
  if (!Number.isInteger(nivel) || nivel < 0) {
    throw new RangeError(`El nivel debe ser un entero >= 0 (recibido: ${nivel}).`);
  }
}

/** Costo de alcanzar el nivel `n` de un campo. Crece geométricamente con `n`. */
function costoDeNivel(campo: CampoTecnologico, n: NivelTecnologico): number {
  exigirNivel(n);
  return COSTO_BASE[campo] * FACTOR_COSTO ** (n - 1);
}

/**
 * Efecto del nivel `n` de un campo, en [0, 1). Satura: cada nivel nuevo aporta menos
 * que el anterior, así que ningún campo domina sin límite.
 */
function efectoDeNivel(campo: CampoTecnologico, n: NivelTecnologico): number {
  exigirNivel(n);
  return 1 - Math.exp(-K_EFECTO[campo] * n);
}

/**
 * Probabilidad de subir del `nivelActual` al siguiente en un ciclo, dada la inversión
 * efectiva. Está en [0, 1), crece con la inversión y baja con el nivel.
 */
function probabilidadDescubrimiento(
  inversionEfectiva: number,
  campo: CampoTecnologico,
  nivelActual: NivelTecnologico,
): number {
  if (!(inversionEfectiva >= 0)) throw new RangeError("La inversión no puede ser negativa.");
  exigirNivel(nivelActual);
  const costo = costoDeNivel(campo, nivelActual + 1);
  return 1 - Math.exp((-LAMBDA * inversionEfectiva) / costo);
}

/**
 * Factor por el que se multiplica el costo del procesamiento según la energía disponible.
 * Energía barata (nivel alto) abarata el procesamiento. Va de 1 a 1 - DESCUENTO_ENERGIA.
 */
function factorCostoProcesamiento(nivelEnergia: NivelTecnologico): number {
  return 1 - DESCUENTO_ENERGIA * efectoDeNivel("energia", nivelEnergia);
}

/**
 * Multiplicador de la demanda energética del procesamiento. Más procesamiento exige más
 * energía (el lado de rebote de Jevons). Va de 1 a 1 + REBOTE_PROCESAMIENTO.
 */
function demandaEnergeticaProcesamiento(nivelProcesamiento: NivelTecnologico): number {
  return 1 + REBOTE_PROCESAMIENTO * efectoDeNivel("procesamiento", nivelProcesamiento);
}

/**
 * Inversión que cuenta para descubrir un campo, después de las interacciones entre campos.
 * Solo el procesamiento tiene un efecto directo: se invierte más "eficientemente" con
 * energía barata. La energía no se abarata por procesamiento; la demanda extra se
 * refleja en `demandaEnergeticaProcesamiento` para quien la quiera medir.
 */
function inversionEfectiva(
  campo: CampoTecnologico,
  inversion: number,
  niveles: NivelesPorCampo,
): number {
  if (!(inversion >= 0)) throw new RangeError("La inversión no puede ser negativa.");
  if (campo === "procesamiento") return inversion / factorCostoProcesamiento(niveles.energia);
  return inversion;
}

/**
 * Intenta un descubrimiento en el ciclo. Consume exactamente un valor de `aleatorio`,
 * tenga éxito o no, así que la cantidad de azar por ciclo no depende del resultado.
 */
function intentarDescubrir(
  inversion: number,
  campo: CampoTecnologico,
  niveles: NivelesPorCampo,
  aleatorio: Aleatorio,
): ResultadoIntento {
  const nivelActual = niveles[campo];
  if (nivelActual >= NIVEL_MAXIMO) {
    aleatorio.siguiente();
    return { descubierto: false, probabilidad: 0 };
  }
  const probabilidad = probabilidadDescubrimiento(
    inversionEfectiva(campo, inversion, niveles),
    campo,
    nivelActual,
  );
  const descubierto = aleatorio.siguiente() < probabilidad;
  return { descubierto, probabilidad };
}

/**
 * Progreso natural: sin inversión, un nivel con baja probabilidad por ciclo. Está acotado
 * por NIVEL_TECHO_NATURAL, así que nunca reemplaza a la inversión. Consume un valor de
 * `aleatorio` siempre, por la misma razón que `intentarDescubrir`.
 */
function progresoNatural(nivelActual: NivelTecnologico, aleatorio: Aleatorio): boolean {
  exigirNivel(nivelActual);
  const tiraDado = aleatorio.siguiente();
  return nivelActual < NIVEL_TECHO_NATURAL && tiraDado < PROGRESO_NATURAL;
}

export {
  COSTO_BASE,
  NIVEL_MAXIMO,
  NIVEL_TECHO_NATURAL,
  costoDeNivel,
  demandaEnergeticaProcesamiento,
  efectoDeNivel,
  factorCostoProcesamiento,
  intentarDescubrir,
  inversionEfectiva,
  probabilidadDescubrimiento,
  progresoNatural,
};
export type { NivelesPorCampo, ResultadoIntento };
