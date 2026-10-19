import type { CampoTecnologico, VectorValores } from "./contratosTecnologia";
import Persona from "./Persona";

/**
 * Constantes de calibración del sueldo (propuestas de arranque, ver docs/tecnologia.md).
 * - SUELDO_BASE_INVESTIGADOR: lo que cobra un investigador de habilidad 0.
 * - PREMIO_HABILIDAD: cuánto sube el sueldo por unidad de habilidad (1 = +100% con habilidad 1).
 */
const SUELDO_BASE_INVESTIGADOR = 80000;
const PREMIO_HABILIDAD = 1;

/**
 * Persona dedicada a investigar un campo tecnológico. Puede trabajar para una empresa
 * (`empleador` es su nombre) o ser independiente (`null`).
 *
 * Extiende `Persona` y no `Empleado`: `Empleado` exige una instancia de `Empresa`, y un
 * investigador independiente no tiene ninguna. Por eso el empleador se guarda por nombre.
 */
class Investigador extends Persona {
  campo: CampoTecnologico;
  /** Entre 0 y 1. Aporta a la inversión efectiva de su empleador. */
  habilidad: number;
  personalidad: VectorValores;
  /** Nombre de la empresa que lo emplea, o `null` si es independiente. */
  empleador: string | null;

  constructor(
    nombre: string,
    campo: CampoTecnologico,
    habilidad: number,
    personalidad: VectorValores,
    empleador: string | null = null,
  ) {
    super(nombre, 0, "", new Date(), "", "", empleador !== null);
    this.campo = campo;
    this.habilidad = habilidad;
    this.personalidad = personalidad;
    this.empleador = empleador;
  }

  /** Sueldo base: crece con la habilidad. Mismo rol que `Empleado.calcularSueldo()`. */
  calcularSueldo(): number {
    return SUELDO_BASE_INVESTIGADOR * (1 + PREMIO_HABILIDAD * this.habilidad);
  }

  /** Pasa a trabajar para la empresa indicada. */
  contratarPor(empresa: string): void {
    this.empleador = empresa;
    this.empleado = true;
  }

  /** Deja su empleo y queda independiente. */
  volverIndependiente(): void {
    this.empleador = null;
    this.empleado = false;
  }

  esIndependiente(): boolean {
    return this.empleador === null;
  }
}

export { PREMIO_HABILIDAD, SUELDO_BASE_INVESTIGADOR };
export default Investigador;
