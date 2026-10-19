/**
 * Contratos compartidos del bloque Tecnología / Investigación / Jurisdicciones.
 * Ver docs/tecnologia.md. Lo usan en paralelo varias sesiones de trabajo: no cambiar
 * una firma de acá sin actualizar el documento y avisar en el PR.
 */

/** Campos tecnológicos. Cada uno tiene un efecto distinto en la economía. */
const CAMPOS_TECNOLOGICOS = ["energia", "procesamiento", "burocracia"] as const;
type CampoTecnologico = (typeof CAMPOS_TECNOLOGICOS)[number];

/** Nivel alcanzado en un campo. Entero >= 0; todas las empresas arrancan en 0. */
type NivelTecnologico = number;

/**
 * Taxonomía CERRADA de valores. Empresas e investigadores comparten el mismo vector,
 * así que la afinidad entre ambos es comparable. Ampliarla es un cambio de contrato.
 */
const VALORES = ["militar", "ecosistema", "lucro", "innovacion", "social", "estabilidad"] as const;
type Valor = (typeof VALORES)[number];

/** Peso de cada valor, entre 0 y 1. No hace falta que sume 1. */
type VectorValores = Record<Valor, number>;

/** Vector con todos los valores en 0. */
function valoresNulos(): VectorValores {
  return Object.fromEntries(VALORES.map((valor) => [valor, 0])) as VectorValores;
}

/**
 * Afinidad entre dos vectores de valores: similitud coseno, entre 0 y 1
 * (los pesos no son negativos). Si alguno es nulo, la afinidad es 0.
 */
function afinidad(a: VectorValores, b: VectorValores): number {
  let punto = 0;
  let normaA = 0;
  let normaB = 0;
  for (const valor of VALORES) {
    punto += a[valor] * b[valor];
    normaA += a[valor] ** 2;
    normaB += b[valor] ** 2;
  }
  if (normaA === 0 || normaB === 0) return 0;
  return Math.min(1, Math.max(0, punto / Math.sqrt(normaA * normaB)));
}

/** Ciclo de vida de una patente. */
type EstadoPatente = "privada" | "licenciada" | "publica";

/**
 * Fuente de azar con semilla. Todo azar de la simulación sale de acá, nunca de
 * `Math.random()`, para poder persistir el estado y reproducir una corrida.
 */
interface Aleatorio {
  /** Siguiente número en [0, 1). */
  siguiente(): number;
  /** Estado interno, para guardarlo en SQLite y retomar la secuencia. */
  estado(): number;
}

export {
  CAMPOS_TECNOLOGICOS,
  VALORES,
  afinidad,
  valoresNulos,
  type Aleatorio,
  type CampoTecnologico,
  type EstadoPatente,
  type NivelTecnologico,
  type Valor,
  type VectorValores,
};
