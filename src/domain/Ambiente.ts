/**
 * Calibración del ambiente. Dos escalas de tiempo:
 * - Stock lento (`contaminacion`): se acumula con las emisiones y se absorbe de a poco.
 *   Gobierna `temperatura` y `biodiversidad`.
 * - Aire rápido (`calidadAire`): reacciona al flujo de emisiones del período y se recupera
 *   en pocos períodos si la producción cae (el efecto pandemia: el aire mejora en semanas,
 *   el clima no).
 */

/** Fracción del stock de contaminación que absorbe el ambiente por período (0,5%). */
const ABSORCION_STOCK = 0.005;
/** Fracción de la contaminación del aire que persiste de un período al siguiente. */
const PERSISTENCIA_AIRE = 0.6;
/** Emisión por período con la semilla del mundo (empresas del fixture, período 1). */
const EMISION_DE_REFERENCIA = 7.5e-4;
/** Contaminación del aire de la semilla (1 − calidad de aire inicial). */
const AIRE_DE_REFERENCIA = 0.12;
/**
 * Cuánta contaminación del aire aporta cada unidad de emisión. Se calibra para que, con la
 * emisión de referencia sostenida, el aire quede en el nivel de la semilla:
 * `aire* = sensibilidad × emisión / (1 − persistencia)`.
 */
const SENSIBILIDAD_AIRE = (AIRE_DE_REFERENCIA * (1 - PERSISTENCIA_AIRE)) / EMISION_DE_REFERENCIA;

/**
 * Estado ambiental. La producción emite, el ambiente absorbe, y el ambiente arrastra
 * la productividad y el PIB.
 */
class Ambiente {
  contaminacion: number;
  calidadAire: number;
  /** Anomalía de temperatura en °C respecto de la referencia. */
  temperatura: number;
  biodiversidad: number;

  /** `calidadAire` es opcional: por defecto arranca en equilibrio con el stock (1 − contaminación). */
  constructor(
    contaminacion: number = 0.1,
    temperatura: number = 0,
    biodiversidad: number = 0.9,
    calidadAire?: number,
  ) {
    this.contaminacion = contaminacion;
    this.calidadAire = calidadAire ?? Number((1 - contaminacion).toFixed(4));
    this.temperatura = temperatura;
    this.biodiversidad = biodiversidad;
  }

  /**
   * Arrastre ambiental (0..0.9) que multiplica a la baja la producción:
   * `produccion × (1 − impacto())`.
   */
  impacto(): number {
    const bruto =
      this.contaminacion * 0.5 + Math.max(0, this.temperatura) * 0.1 + (1 - this.calidadAire) * 0.2;
    return Number(Math.min(0.9, bruto).toFixed(6));
  }

  /**
   * Registra las emisiones de un período (intensidad ya escalada): suben el stock lento y la
   * contaminación del aire, que además conserva parte de la del período anterior.
   */
  registrarEmision(intensidad: number): void {
    this.contaminacion = Number(Math.min(1, this.contaminacion + intensidad).toFixed(6));
    const aire = Math.min(
      1,
      (1 - this.calidadAire) * PERSISTENCIA_AIRE + SENSIBILIDAD_AIRE * intensidad,
    );
    this.calidadAire = Number(Math.max(0, 1 - aire).toFixed(4));
    this.sincronizarDerivados();
  }

  /**
   * Absorción natural del stock por período. El aire no se toca acá: se recupera solo,
   * porque su persistencia ya lo hace decaer cuando las emisiones bajan.
   */
  regenerar(): void {
    this.contaminacion = Number((this.contaminacion * (1 - ABSORCION_STOCK)).toFixed(6));
    this.sincronizarDerivados();
  }

  /** Temperatura y biodiversidad siguen al stock lento. */
  private sincronizarDerivados(): void {
    this.temperatura = Number((this.contaminacion * 2).toFixed(4));
    this.biodiversidad = Number(Math.max(0, (1 - this.contaminacion) * 0.9).toFixed(4));
  }
}

export {
  ABSORCION_STOCK,
  AIRE_DE_REFERENCIA,
  EMISION_DE_REFERENCIA,
  PERSISTENCIA_AIRE,
  SENSIBILIDAD_AIRE,
};
export default Ambiente;
