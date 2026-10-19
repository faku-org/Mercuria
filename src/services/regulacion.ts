import Estado from "../domain/Estado";
import type LeyTecnologica from "../domain/LeyTecnologica";
import type { ParametrosPatente } from "../domain/LeyTecnologica";
import type Nacion from "../domain/Nacion";
import { afinidad, valoresNulos } from "../domain/contratosTecnologia";
import type {
  CampoTecnologico,
  NivelTecnologico,
  VectorValores,
} from "../domain/contratosTecnologia";

/*
 * Regulación y jurisdicciones (docs/tecnologia.md, sección 6).
 *
 * Funciones puras: reciben jurisdicciones y leyes como datos y no guardan estado.
 *
 * Resolución de una regulación (prioridad):
 *  1. Entre las locales manda el estado sobre la nación: si el estado tiene alguna ley
 *     activa que cubre el campo y el nivel, la nación se ignora (igual que
 *     `Estado.factorLeyes`).
 *  2. Las leyes globales son un PISO COMÚN: se combinan con la local tomando la más
 *     estricta (libre < permiso < prohibida). Una jurisdicción puede ser más dura que
 *     el piso, nunca más laxa. Por eso mudarse no evade una ley global.
 *
 * Contaminación global: el daño ambiental no queda en la jurisdicción que lo emite, lo
 * absorbe todo el planeta. Mudarse a un lugar laxo externaliza ese daño: la empresa se
 * lleva el beneficio y el costo lo paga el resto. El desglose lo reporta en
 * `externalidad`, que NO entra en el balance privado (es lo que paga otro).
 */

// ---------------------------------------------------------------------------
// Constantes de calibración (propuestas de arranque, se ajustan con tests).
// ---------------------------------------------------------------------------

/** Parámetros de patente cuando ninguna ley los fija. */
const PATENTE_POR_DEFECTO: ParametrosPatente = { plazoMaximo: 20, renovarCada: 5, tarifa: 100 };
/** Costo base de mudarse a otro estado de la misma nación. */
const COSTO_BASE_ENTRE_ESTADOS = 50_000;
/** Costo base de mudarse a otra nación. */
const COSTO_BASE_ENTRE_NACIONES = 250_000;
/** Reducción máxima del costo de mudanza con burocracia al límite (0 a 1). */
const REDUCCION_MAXIMA_BUROCRACIA = 0.7;
/** Velocidad con que la burocracia abarata la mudanza: 1 − e^(−k × nivel). */
const K_BUROCRACIA = 0.35;
/** Fracción de los ingresos que se pierde si el destino tiene población cero. */
const ELASTICIDAD_CLIENTES = 0.6;
/** Emisión por período a partir de la cual la empresa cuenta como totalmente contaminante. */
const EMISION_REFERENCIA = 100;
/** Períodos de sueldo que cuesta reemplazar a un investigador que se va. */
const PERIODOS_DE_REEMPLAZO = 12;
/** Precio sombra de una unidad de emisión, para reportar la externalidad. */
const PRECIO_SOMBRA_CONTAMINACION = 2;
/** Niveles que se exploran para hallar el tope (alcanza: el costo crece 1,6^n). */
const NIVELES_EXPLORADOS = 60;

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Ubicación de una empresa: una nación y, opcionalmente, un estado dentro de ella. */
interface Jurisdiccion {
  nacion: Nacion;
  estado?: Estado;
}

type EstadoRegulacion = "libre" | "permiso" | "prohibida";
type OrigenRegulacion = "estado" | "nacion" | "global";

interface ResultadoRegulacion {
  estado: EstadoRegulacion;
  /** Quién decidió. `null` si no hay ninguna ley que cubra el campo y el nivel. */
  origen: OrigenRegulacion | null;
  /** Ley que decidió, si hay. */
  ley: LeyTecnologica | null;
}

interface PropuestaMudanza {
  origen: Jurisdiccion;
  destino: Jurisdiccion;
  /** Tecnología que la empresa quiere operar. */
  campo: CampoTecnologico;
  nivel: NivelTecnologico;
  /** Ganancia por período de poder operarla. */
  beneficioPorPeriodo: number;
  /** Períodos sobre los que se evalúa. */
  horizonte: number;
  nivelBurocracia: NivelTecnologico;
  ingresosPorPeriodo: number;
  /** Emisión por período de la empresa. */
  emisionPorPeriodo: number;
  /** Investigadores empleados: su personalidad y su sueldo por período. */
  investigadores?: { personalidad: VectorValores; sueldo: number }[];
  /** ¿Tiene el permiso en el origen y el destino si hace falta? Por defecto no. */
  tienePermiso?: boolean;
}

interface DesgloseMudanza {
  /** Beneficio total de evadir la norma (0 si no hay nada que evadir). */
  beneficio: number;
  costoMudanza: number;
  /** Ingresos perdidos por la menor población del destino. */
  perdidaClientes: number;
  /** Costo esperado de reemplazar investigadores que rechazan a la empresa. */
  rechazoInvestigadores: number;
  costoTotal: number;
  /** beneficio − costoTotal. La decisión es `balance > 0`. */
  balance: number;
  /** Daño ambiental global que se externaliza. No entra en el balance privado. */
  externalidad: number;
  regulacionOrigen: ResultadoRegulacion;
  regulacionDestino: ResultadoRegulacion;
  /** Origen no permite la tecnología y el destino sí. */
  evadeNorma: boolean;
  /** El destino la bloquea una ley global: el piso común no se evade. */
  bloqueadaPorPisoGlobal: boolean;
}

type MotivoMudanza =
  | "conviene"
  | "sin-norma-que-evadir"
  | "piso-global"
  | "costos-superan-beneficio";

interface DecisionMudanza {
  conviene: boolean;
  motivo: MotivoMudanza;
  desglose: DesgloseMudanza;
}

// ---------------------------------------------------------------------------
// Resolución de regulación
// ---------------------------------------------------------------------------

const ESTRICTEZ: Record<EstadoRegulacion, number> = { libre: 0, permiso: 1, prohibida: 2 };

/** Pasa una jurisdicción a su forma de datos. */
function jurisdiccionDe(ubicacion: Nacion | Estado): Jurisdiccion {
  return ubicacion instanceof Estado
    ? { nacion: ubicacion.nacion, estado: ubicacion }
    : { nacion: ubicacion };
}

/** Efecto de una ley sobre un nivel que ya sabemos que cubre. */
function evaluarLey(ley: LeyTecnologica, nivel: NivelTecnologico): EstadoRegulacion {
  if (ley.regulacion === "prohibida") return "prohibida";
  if (ley.regulacion === "permiso") return "permiso";
  return nivel > (ley.topeNivel ?? Number.POSITIVE_INFINITY) ? "prohibida" : "libre";
}

/** La más estricta de varias leyes del mismo ámbito. `null` si no hay ninguna. */
function masEstricta(leyes: LeyTecnologica[], nivel: NivelTecnologico): ResultadoRegulacion | null {
  let mejor: ResultadoRegulacion | null = null;
  for (const ley of leyes) {
    const estado = evaluarLey(ley, nivel);
    if (mejor === null || ESTRICTEZ[estado] > ESTRICTEZ[mejor.estado]) {
      mejor = { estado, origen: ley.alcance, ley };
    }
  }
  return mejor;
}

/**
 * Regulación vigente de un campo y un nivel en una jurisdicción: estado sobre nación,
 * con las leyes globales como piso (se toma la más estricta entre ambas).
 */
function regulacionDe(
  campo: CampoTecnologico,
  nivel: NivelTecnologico,
  jurisdiccion: Jurisdiccion,
  leyes: LeyTecnologica[],
): ResultadoRegulacion {
  const aplicables = leyes.filter(
    (ley) =>
      ley.activa &&
      ley.regulacion !== undefined &&
      ley.campo === campo &&
      ley.cubreNivel(nivel) &&
      ley.aplicaEn(jurisdiccion.nacion, jurisdiccion.estado),
  );
  const delAmbito = (alcance: OrigenRegulacion) =>
    masEstricta(
      aplicables.filter((ley) => ley.alcance === alcance),
      nivel,
    );

  const local = delAmbito("estado") ?? delAmbito("nacion");
  const global = delAmbito("global");
  const libre: ResultadoRegulacion = { estado: "libre", origen: null, ley: null };
  if (global === null) return local ?? libre;
  // Piso común: gana el más estricto; en empate, la ley más específica (la local).
  if (local === null || ESTRICTEZ[global.estado] > ESTRICTEZ[local.estado]) return global;
  return local;
}

/** ¿Puede operarse ese nivel? Con regulación `permiso` hace falta `tienePermiso`. */
function estaPermitida(
  campo: CampoTecnologico,
  nivel: NivelTecnologico,
  jurisdiccion: Jurisdiccion,
  leyes: LeyTecnologica[],
  tienePermiso = false,
): boolean {
  const { estado } = regulacionDe(campo, nivel, jurisdiccion, leyes);
  return estado === "libre" || (estado === "permiso" && tienePermiso);
}

/**
 * Mayor nivel permitido de forma continua desde 0: el primer nivel prohibido marca el
 * corte. `Infinity` si no hay límite; `-1` si ni siquiera el nivel 0 está permitido.
 */
function topeDeNivel(
  campo: CampoTecnologico,
  jurisdiccion: Jurisdiccion,
  leyes: LeyTecnologica[],
  tienePermiso = false,
): number {
  for (let nivel = 0; nivel < NIVELES_EXPLORADOS; nivel++) {
    if (!estaPermitida(campo, nivel, jurisdiccion, leyes, tienePermiso)) return nivel - 1;
  }
  return Number.POSITIVE_INFINITY;
}

/**
 * Parámetros de patente de una jurisdicción. Cada parámetro sale de la ley más
 * específica que lo fije (estado, luego nación, luego global); lo que nadie fija toma
 * el valor por defecto. Con `campo` solo cuentan las leyes de ese campo.
 */
function parametrosDePatente(
  jurisdiccion: Jurisdiccion,
  leyes: LeyTecnologica[],
  campo?: CampoTecnologico,
): ParametrosPatente {
  const aplicables = leyes.filter(
    (ley) =>
      ley.activa &&
      (campo === undefined || ley.campo === campo) &&
      ley.aplicaEn(jurisdiccion.nacion, jurisdiccion.estado),
  );
  const resultado = { ...PATENTE_POR_DEFECTO };
  for (const clave of ["plazoMaximo", "renovarCada", "tarifa"] as const) {
    for (const alcance of ["estado", "nacion", "global"] as const) {
      const ley = aplicables.find((l) => l.alcance === alcance && l.patente[clave] !== undefined);
      if (ley !== undefined) {
        resultado[clave] = ley.patente[clave] as number;
        break;
      }
    }
  }
  return resultado;
}

// ---------------------------------------------------------------------------
// Mudanza
// ---------------------------------------------------------------------------

/** Fracción del costo que se ahorra con burocracia: 0 en el nivel 0, satura en el máximo. */
function ahorroPorBurocracia(nivelBurocracia: NivelTecnologico): number {
  const nivel = Math.max(0, nivelBurocracia);
  return REDUCCION_MAXIMA_BUROCRACIA * (1 - Math.exp(-K_BUROCRACIA * nivel));
}

/**
 * Costo de mudarse. 0 si es la misma jurisdicción; entre estados de una nación cuesta
 * menos que entre naciones. Baja con el nivel de burocracia.
 */
function costoDeMudanza(
  origen: Jurisdiccion,
  destino: Jurisdiccion,
  nivelBurocracia: NivelTecnologico,
): number {
  let base = 0;
  if (origen.nacion !== destino.nacion) base = COSTO_BASE_ENTRE_NACIONES;
  else if (origen.estado !== destino.estado) base = COSTO_BASE_ENTRE_ESTADOS;
  return base * (1 - ahorroPorBurocracia(nivelBurocracia));
}

/** Ingresos perdidos: proporcional a cuánto menor es la población de la nación destino. */
function perdidaDeClientes(propuesta: PropuestaMudanza): number {
  const origen = propuesta.origen.nacion.poblacion;
  const destino = propuesta.destino.nacion.poblacion;
  if (propuesta.origen.nacion === propuesta.destino.nacion || origen <= 0) return 0;
  const diferencia = Math.max(0, (origen - destino) / origen);
  return propuesta.ingresosPorPeriodo * propuesta.horizonte * ELASTICIDAD_CLIENTES * diferencia;
}

/**
 * Costo esperado de que investigadores con valores de ecosistema rechacen a una empresa
 * contaminante. La probabilidad de irse de cada uno es su afinidad con el valor
 * `ecosistema` por cuán contaminante es la empresa (0 a 1). Solo se aplica cuando la
 * mudanza evade una norma: es la señal de que la empresa busca contaminar sin control.
 */
function rechazoDeInvestigadores(propuesta: PropuestaMudanza): number {
  const ecosistema: VectorValores = { ...valoresNulos(), ecosistema: 1 };
  const contaminante = Math.min(1, Math.max(0, propuesta.emisionPorPeriodo / EMISION_REFERENCIA));
  let costo = 0;
  for (const investigador of propuesta.investigadores ?? []) {
    const probabilidadDeIrse = afinidad(investigador.personalidad, ecosistema) * contaminante;
    costo += probabilidadDeIrse * investigador.sueldo * PERIODOS_DE_REEMPLAZO;
  }
  return costo;
}

/**
 * Evalúa si conviene mudarse para evadir una norma. Beneficio (solo si el origen no
 * permite la tecnología y el destino sí) contra costo de mudanza, pérdida de clientes y
 * rechazo de investigadores. Devuelve la decisión con el desglose completo.
 * Una ley global rige en ambos lados, así que nunca se evade.
 */
function evaluarMudanza(propuesta: PropuestaMudanza, leyes: LeyTecnologica[]): DecisionMudanza {
  const { campo, nivel, origen, destino, tienePermiso = false } = propuesta;
  const regulacionOrigen = regulacionDe(campo, nivel, origen, leyes);
  const regulacionDestino = regulacionDe(campo, nivel, destino, leyes);
  const permitidaOrigen = estaPermitida(campo, nivel, origen, leyes, tienePermiso);
  const permitidaDestino = estaPermitida(campo, nivel, destino, leyes, tienePermiso);

  const evadeNorma = !permitidaOrigen && permitidaDestino;
  const bloqueadaPorPisoGlobal = !permitidaDestino && regulacionDestino.origen === "global";

  const beneficio = evadeNorma ? propuesta.beneficioPorPeriodo * propuesta.horizonte : 0;
  const costoMudanza = costoDeMudanza(origen, destino, propuesta.nivelBurocracia);
  const perdidaClientes = perdidaDeClientes(propuesta);
  const rechazoInvestigadores = evadeNorma ? rechazoDeInvestigadores(propuesta) : 0;
  const costoTotal = costoMudanza + perdidaClientes + rechazoInvestigadores;
  const balance = beneficio - costoTotal;
  const externalidad = evadeNorma
    ? propuesta.emisionPorPeriodo * propuesta.horizonte * PRECIO_SOMBRA_CONTAMINACION
    : 0;

  const conviene = balance > 0;
  let motivo: MotivoMudanza = "costos-superan-beneficio";
  if (conviene) motivo = "conviene";
  else if (bloqueadaPorPisoGlobal) motivo = "piso-global";
  else if (!evadeNorma) motivo = "sin-norma-que-evadir";

  return {
    conviene,
    motivo,
    desglose: {
      beneficio,
      costoMudanza,
      perdidaClientes,
      rechazoInvestigadores,
      costoTotal,
      balance,
      externalidad,
      regulacionOrigen,
      regulacionDestino,
      evadeNorma,
      bloqueadaPorPisoGlobal,
    },
  };
}

export {
  costoDeMudanza,
  estaPermitida,
  evaluarMudanza,
  jurisdiccionDe,
  parametrosDePatente,
  regulacionDe,
  topeDeNivel,
  type DecisionMudanza,
  type DesgloseMudanza,
  type EstadoRegulacion,
  type Jurisdiccion,
  type MotivoMudanza,
  type OrigenRegulacion,
  type PropuestaMudanza,
  type ResultadoRegulacion,
};
export default regulacionDe;
