import type { EstadoPatente } from "./contratosTecnologia";

/*
 * Parámetros por defecto de una patente (ver docs/tecnologia.md, sección 3).
 * En el diseño final los fija la ley de cada nación (épica L); acá son solo el valor
 * de arranque cuando nadie los pasa.
 *   PLAZO_MAXIMO_DEFECTO  ciclos de vida máxima antes de pasar a pública.
 *   RENOVAR_CADA_DEFECTO  cada cuántos ciclos hay que pagar la renovación.
 *   TARIFA_BASE_DEFECTO   tarifa de la primera renovación.
 *   CRECIMIENTO_TARIFA    factor multiplicativo de la tarifa por cada renovación pagada.
 */
const PLAZO_MAXIMO_DEFECTO = 60;
const RENOVAR_CADA_DEFECTO = 10;
const TARIFA_BASE_DEFECTO = 50;
const CRECIMIENTO_TARIFA_DEFECTO = 1.5;

/** Por qué una patente pasó a pública. */
type MotivoPublica = "vencimiento" | "lapso";

/** Regalía cobrada a un licenciatario en un ciclo. */
interface CobroRegalia {
  licenciatario: string;
  monto: number;
}

/** Qué ocurrió en un ciclo de la patente. */
interface ResultadoCicloPatente {
  /** Edad de la patente (en ciclos) tras avanzar. */
  edad: number;
  estado: EstadoPatente;
  regalias: CobroRegalia[];
  totalRegalias: number;
  /** Tarifa de renovación pagada este ciclo (0 si no tocaba o no se pagó). */
  tarifaCobrada: number;
  /** Solo si en este ciclo pasó a pública. */
  motivoPublica?: MotivoPublica;
}

interface OpcionesPatente {
  plazoMaximo?: number;
  renovarCada?: number;
  tarifaRenovacion?: number;
  crecimientoTarifa?: number;
}

function exigirEnteroPositivo(valor: number, nombre: string): void {
  if (!Number.isInteger(valor) || valor < 1) {
    throw new RangeError(`${nombre} debe ser un entero >= 1 (recibido: ${valor}).`);
  }
}

/**
 * Patente de una tecnología. Ciclo de vida:
 * privada -> licenciada -> publica, o privada -> publica. Pasar a pública es definitivo.
 * Si se quita la última licencia, vuelve de licenciada a privada.
 */
class Patente {
  readonly dueno: string;
  readonly plazoMaximo: number;
  readonly renovarCada: number;
  readonly tarifaBase: number;
  readonly crecimientoTarifa: number;

  #estado: EstadoPatente = "privada";
  #edad = 0;
  #renovaciones = 0;
  #regalias = new Map<string, number>();

  constructor(dueno: string, opciones: OpcionesPatente = {}) {
    this.dueno = dueno;
    this.plazoMaximo = opciones.plazoMaximo ?? PLAZO_MAXIMO_DEFECTO;
    this.renovarCada = opciones.renovarCada ?? RENOVAR_CADA_DEFECTO;
    this.tarifaBase = opciones.tarifaRenovacion ?? TARIFA_BASE_DEFECTO;
    this.crecimientoTarifa = opciones.crecimientoTarifa ?? CRECIMIENTO_TARIFA_DEFECTO;

    exigirEnteroPositivo(this.plazoMaximo, "plazoMaximo");
    exigirEnteroPositivo(this.renovarCada, "renovarCada");
    if (!(this.tarifaBase >= 0))
      throw new RangeError("La tarifa de renovación no puede ser negativa.");
    if (!(this.crecimientoTarifa >= 1)) {
      throw new RangeError("El crecimiento de la tarifa debe ser >= 1 (tarifa creciente).");
    }
  }

  get estado(): EstadoPatente {
    return this.#estado;
  }

  /** Ciclos transcurridos desde que se concedió. */
  get edad(): number {
    return this.#edad;
  }

  /** Renovaciones pagadas hasta ahora. */
  get renovaciones(): number {
    return this.#renovaciones;
  }

  get licenciatarios(): string[] {
    return [...this.#regalias.keys()];
  }

  /** Regalía por ciclo que paga `nombre`, o undefined si no es licenciatario. */
  regaliaDe(nombre: string): number | undefined {
    return this.#regalias.get(nombre);
  }

  /** Tarifa de la próxima renovación: base x crecimiento^renovacionesPagadas. */
  tarifaRenovacion(): number {
    return this.tarifaBase * this.crecimientoTarifa ** this.#renovaciones;
  }

  /** ¿Puede esta empresa usar la tecnología? Pública: cualquiera. Si no: dueño o licenciatario. */
  puedeUsar(empresa: string): boolean {
    return this.#estado === "publica" || empresa === this.dueno || this.#regalias.has(empresa);
  }

  /** Concede una licencia. Falla si la patente ya es pública o el licenciatario ya existe. */
  licenciar(licenciatario: string, regaliaPorCiclo: number): void {
    if (this.#estado === "publica") {
      throw new Error("No se puede licenciar una patente pública: ya la usa cualquiera.");
    }
    if (licenciatario === this.dueno) {
      throw new Error("El dueño no puede licenciarse su propia patente.");
    }
    if (this.#regalias.has(licenciatario)) {
      throw new Error(`${licenciatario} ya es licenciatario de esta patente.`);
    }
    if (!(regaliaPorCiclo >= 0)) throw new RangeError("La regalía no puede ser negativa.");
    this.#regalias.set(licenciatario, regaliaPorCiclo);
    this.#estado = "licenciada";
  }

  /** Revoca una licencia. Si era la última, la patente vuelve a privada. */
  quitarLicencia(licenciatario: string): void {
    if (this.#estado === "publica") {
      throw new Error("Una patente pública no tiene licencias que quitar.");
    }
    if (!this.#regalias.delete(licenciatario)) {
      throw new Error(`${licenciatario} no es licenciatario de esta patente.`);
    }
    if (this.#regalias.size === 0) this.#estado = "privada";
  }

  /**
   * Avanza un ciclo. Orden de reglas:
   * 1. Si se llega a `plazoMaximo`, pasa a pública por vencimiento (sin cobros).
   * 2. Si toca renovar (cada `renovarCada` ciclos) y no se paga, lapsa a pública.
   *    Si se paga, se cobra la tarifa vigente y la tarifa siguiente crece.
   * 3. Si sigue vigente, se cobran las regalías de los licenciatarios.
   * Falla si la patente ya es pública.
   */
  avanzarCiclo(pagaRenovacion = true): ResultadoCicloPatente {
    if (this.#estado === "publica") {
      throw new Error("Una patente pública no avanza de ciclo.");
    }
    this.#edad += 1;

    if (this.#edad >= this.plazoMaximo) {
      return this.#hacerPublica("vencimiento", 0);
    }

    let tarifaCobrada = 0;
    if (this.#edad % this.renovarCada === 0) {
      if (!pagaRenovacion) return this.#hacerPublica("lapso", 0);
      tarifaCobrada = this.tarifaRenovacion();
      this.#renovaciones += 1;
    }

    const regalias = [...this.#regalias].map(([licenciatario, monto]) => ({
      licenciatario,
      monto,
    }));
    const totalRegalias = regalias.reduce((suma, cobro) => suma + cobro.monto, 0);
    return { edad: this.#edad, estado: this.#estado, regalias, totalRegalias, tarifaCobrada };
  }

  #hacerPublica(motivo: MotivoPublica, tarifaCobrada: number): ResultadoCicloPatente {
    this.#estado = "publica";
    this.#regalias.clear();
    return {
      edad: this.#edad,
      estado: this.#estado,
      regalias: [],
      totalRegalias: 0,
      tarifaCobrada,
      motivoPublica: motivo,
    };
  }
}

export default Patente;
export type { CobroRegalia, MotivoPublica, OpcionesPatente, ResultadoCicloPatente };
