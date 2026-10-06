/**
 * Estado ambiental. La producción degrada el ambiente y el ambiente arrastra
 * la productividad y el PIB.
 */
class Ambiente {
  contaminacion: number;
  calidadAire: number;
  /** Anomalía de temperatura en °C respecto de la referencia. */
  temperatura: number;
  biodiversidad: number;

  constructor(contaminacion: number = 0.1, temperatura: number = 0, biodiversidad: number = 0.9) {
    this.contaminacion = contaminacion;
    this.calidadAire = Number((1 - contaminacion).toFixed(4));
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

  /** Registra emisiones de un período (intensidad ya escalada). */
  registrarEmision(intensidad: number): void {
    this.contaminacion = Number(Math.min(1, this.contaminacion + intensidad).toFixed(6));
    this.calidadAire = Number(Math.max(0, 1 - this.contaminacion).toFixed(4));
    // La contaminación acumulada empuja la temperatura (efecto invernadero simplificado).
    this.temperatura = Number((this.contaminacion * 2).toFixed(4));
    this.biodiversidad = Number(Math.max(0, this.calidadAire * 0.9).toFixed(4));
  }

  /** Regeneración lenta por período. */
  regenerar(): void {
    this.contaminacion = Number((this.contaminacion * 0.995).toFixed(6));
    this.calidadAire = Number(Math.max(0, 1 - this.contaminacion).toFixed(4));
    this.temperatura = Number((this.contaminacion * 2).toFixed(4));
    this.biodiversidad = Number(Math.max(0, this.calidadAire * 0.9).toFixed(4));
  }
}

export default Ambiente;
