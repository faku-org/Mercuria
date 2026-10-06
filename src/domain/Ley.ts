import type Nacion from "./Nacion";
import { fechaId, idAleatorio } from "./identificadores";

/** Módulo del dominio que la ley modifica. */
type ObjetivoLey = "sueldo" | "empresa" | "propiedad" | "ai";

/** Signo del efecto de la ley. */
type EfectoLey = "positivo" | "negativo";

/** Alcance territorial de la ley. */
type AlcanceLey = "nacion" | "estado" | "global";

interface OpcionesLey {
  /** Signo del efecto. Por defecto `"positivo"`. */
  efecto?: EfectoLey;
  /** Magnitud como fracción (0.1 = 10%). Por defecto 0. */
  magnitud?: number;
  /** A qué módulo afecta. Por defecto `"sueldo"`. */
  objetivo?: ObjetivoLey;
  /** Hasta dónde aplica. Por defecto `"nacion"`. */
  alcance?: AlcanceLey;
  /** Cupo de propiedades, solo para objetivo `"propiedad"`. */
  limite?: number;
  /** Arranca activa. Por defecto `false`. */
  activa?: boolean;
}

class Ley {
  nombre: string;
  id: string;
  descripcion: string;
  afecta: Nacion[];
  activa: boolean;
  efecto: EfectoLey;
  magnitud: number;
  objetivo: ObjetivoLey;
  alcance: AlcanceLey;
  limite?: number;

  constructor(nombre: string, descripcion: string, nacion: Nacion, opciones: OpcionesLey = {}) {
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.efecto = opciones.efecto ?? "positivo";
    this.magnitud = opciones.magnitud ?? 0;
    this.objetivo = opciones.objetivo ?? "sueldo";
    this.alcance = opciones.alcance ?? "nacion";
    this.limite = opciones.limite;
    this.activa = opciones.activa ?? false;
    // Una ley global no se ata a una nación concreta: aplica a todas.
    this.afecta = this.alcance === "global" ? [] : [nacion];
    // Formato: <iniciales nación>-<fecha>-<id>  (ej: US-2026-10-06-k3f9a1).
    this.id = `${nacion.iniciales}-${fechaId()}-${idAleatorio()}`;
  }

  /** Factor con signo que aplica la ley (positivo → +magnitud, negativo → -magnitud). */
  factor(): number {
    return this.efecto === "positivo" ? this.magnitud : -this.magnitud;
  }

  /** ¿La ley aplica sobre esta nación? Las de alcance global aplican a todas. */
  aplicaA(nacion: Nacion): boolean {
    return this.alcance === "global" || this.afecta.includes(nacion);
  }

  activar(): this {
    this.activa = true;
    return this;
  }

  desactivar(): this {
    this.activa = false;
    return this;
  }
}

/**
 * Suma los factores de las leyes globales activas que afectan a un objetivo.
 * Las leyes globales viven fuera de las naciones (no se registran en
 * `nacion.leyes`) para no contarse dos veces.
 */
function factorLeyesGlobales(leyes: Ley[], objetivo: ObjetivoLey): number {
  return leyes
    .filter((ley) => ley.activa && ley.alcance === "global" && ley.objetivo === objetivo)
    .reduce((factor, ley) => factor + ley.factor(), 0);
}

export { type AlcanceLey, type EfectoLey, type ObjetivoLey, type OpcionesLey, factorLeyesGlobales };
export default Ley;
