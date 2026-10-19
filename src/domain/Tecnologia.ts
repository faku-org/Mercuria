import type { CampoTecnologico, NivelTecnologico } from "./contratosTecnologia";
import type Patente from "./Patente";

/**
 * Tecnología descubierta por una empresa: un nivel de un campo, con su patente.
 * Sin patente, solo la usa la empresa descubridora.
 */
class Tecnologia {
  readonly campo: CampoTecnologico;
  readonly nivel: NivelTecnologico;
  /** Nombre de la empresa descubridora. */
  readonly empresa: string;
  readonly patente?: Patente;

  constructor(
    campo: CampoTecnologico,
    nivel: NivelTecnologico,
    empresa: string,
    patente?: Patente,
  ) {
    if (!Number.isInteger(nivel) || nivel < 1) {
      throw new RangeError(
        `El nivel de una tecnología descubierta debe ser un entero >= 1 (recibido: ${nivel}).`,
      );
    }
    this.campo = campo;
    this.nivel = nivel;
    this.empresa = empresa;
    this.patente = patente;
  }

  /** ¿Es de uso libre? Solo si su patente pasó a pública. */
  esPublica(): boolean {
    return this.patente?.estado === "publica";
  }

  /** ¿Puede usarla `empresa`? Sin patente, solo la descubridora. */
  puedeUsar(empresa: string): boolean {
    if (this.patente) return this.patente.puedeUsar(empresa);
    return empresa === this.empresa;
  }
}

export default Tecnologia;
