import Estado from "./Estado";
import Ley from "./Ley";
import type { AlcanceLey } from "./Ley";
import type Nacion from "./Nacion";
import type { CampoTecnologico, NivelTecnologico } from "./contratosTecnologia";
import { fechaId, idAleatorio } from "./identificadores";

/**
 * Tipos de regulación sobre un campo y un rango de niveles:
 * - `prohibida`: operar esos niveles no está permitido.
 * - `permiso`: se puede, pero la empresa necesita un permiso.
 * - `tope`: el nivel máximo permitido es `topeNivel`; por encima se prohíbe.
 */
type TipoRegulacion = "prohibida" | "permiso" | "tope";

/** Parámetros de patente que fija una jurisdicción (ver docs/tecnologia.md, sección 3). */
interface ParametrosPatente {
  /** Ciclos tras los cuales la tecnología pasa a pública. */
  plazoMaximo: number;
  /** Cada cuántos ciclos hay que renovar la patente. */
  renovarCada: number;
  /** Tarifa base de renovación. */
  tarifa: number;
}

interface OpcionesLeyTecnologica {
  /** Campo regulado. */
  campo: CampoTecnologico;
  /** Primer nivel (inclusive) al que aplica. Por defecto 0. */
  nivelDesde?: NivelTecnologico;
  /** Último nivel (inclusive) al que aplica. Por defecto sin límite. */
  nivelHasta?: NivelTecnologico;
  /** Tipo de regulación. Si falta, la ley solo fija parámetros de patente. */
  regulacion?: TipoRegulacion;
  /** Nivel máximo permitido. Obligatorio si `regulacion` es `"tope"`. */
  topeNivel?: NivelTecnologico;
  /** Parámetros de patente que esta ley fija (los que no estén, se heredan). */
  patente?: Partial<ParametrosPatente>;
  /** Alcance. Por defecto `"estado"` si la ubicación es un `Estado`, si no `"nacion"`. */
  alcance?: AlcanceLey;
  /** Arranca activa. Por defecto `false`. */
  activa?: boolean;
}

/**
 * Ley sobre tecnología. Extiende `Ley` sin tocarla: `ObjetivoLey` no incluye
 * `"tecnologia"` (se usa en `Record` exhaustivos de server y web), así que a nivel de
 * `Ley` se declara con objetivo `"empresa"` y magnitud 0, o sea sin efecto numérico.
 *
 * IMPORTANTE: no registrarla en `nacion.leyes` ni `estado.leyes`. Como su objetivo base
 * es `"empresa"`, una ley estatal registrada ahí taparía las leyes de empresa de la
 * nación (prioridad estatal). Se entrega como dato a `services/regulacion.ts`.
 */
class LeyTecnologica extends Ley {
  campo: CampoTecnologico;
  nivelDesde: NivelTecnologico;
  nivelHasta: NivelTecnologico;
  regulacion?: TipoRegulacion;
  topeNivel?: NivelTecnologico;
  patente: Partial<ParametrosPatente>;
  /** Estados a los que aplica (solo con alcance `"estado"`). */
  estado: Estado[];

  constructor(
    nombre: string,
    descripcion: string,
    ubicacion: Nacion | Estado,
    opciones: OpcionesLeyTecnologica,
  ) {
    const esEstado = ubicacion instanceof Estado;
    const alcance = opciones.alcance ?? (esEstado ? "estado" : "nacion");
    if (alcance === "estado" && !esEstado) {
      throw new Error("Una ley de alcance estatal necesita un Estado como ubicación.");
    }
    if (opciones.regulacion === "tope" && opciones.topeNivel === undefined) {
      throw new Error("Una regulación de tipo tope necesita topeNivel.");
    }
    const nacion = esEstado ? ubicacion.nacion : ubicacion;
    super(nombre, descripcion, nacion, {
      objetivo: "empresa",
      magnitud: 0,
      alcance,
      activa: opciones.activa,
    });
    this.campo = opciones.campo;
    this.nivelDesde = opciones.nivelDesde ?? 0;
    this.nivelHasta = opciones.nivelHasta ?? Number.POSITIVE_INFINITY;
    this.regulacion = opciones.regulacion;
    this.topeNivel = opciones.topeNivel;
    this.patente = { ...opciones.patente };
    this.estado = alcance === "estado" && esEstado ? [ubicacion] : [];
    if (alcance === "estado" && esEstado) {
      // Mismo formato que LeyEstatal: <iniciales nación>-<iniciales estado>-<fecha>-<id>.
      this.id = `${nacion.iniciales}-${ubicacion.iniciales}-${fechaId()}-${idAleatorio()}`;
    }
  }

  /** ¿La ley cubre este nivel del campo? (el rango es inclusivo) */
  cubreNivel(nivel: NivelTecnologico): boolean {
    return nivel >= this.nivelDesde && nivel <= this.nivelHasta;
  }

  /** ¿La ley aplica a esta ubicación? Global aplica a todas; estatal solo a sus estados. */
  aplicaEn(nacion: Nacion, estado?: Estado): boolean {
    if (this.alcance === "global") return true;
    if (this.alcance === "estado") return estado !== undefined && this.estado.includes(estado);
    return this.afecta.includes(nacion);
  }
}

export { type OpcionesLeyTecnologica, type ParametrosPatente, type TipoRegulacion };
export default LeyTecnologica;
