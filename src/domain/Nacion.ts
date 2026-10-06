import type Ley from "./Ley";
import type { ObjetivoLey } from "./Ley";
import { iniciales } from "./identificadores";

class Nacion {
  nombre: string;
  id: string;
  iniciales: string;
  capital: string;
  idioma: string;
  poblacion: number;
  leyes: Ley[];

  constructor(nombre: string, capital: string, idioma: string, poblacion: number) {
    this.nombre = nombre;
    this.iniciales = iniciales(nombre);
    this.id =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.capital = capital;
    this.idioma = idioma;
    this.poblacion = poblacion;
    this.leyes = [];
  }

  getNombre(): string {
    return this.nombre;
  }

  /** Registra una ley propia de la nación. */
  registrarLey(ley: Ley): Ley {
    this.leyes.push(ley);
    return ley;
  }

  /** Leyes activas de la nación que afectan a un objetivo concreto. */
  leyesDe(objetivo: ObjetivoLey): Ley[] {
    return this.leyes.filter((ley) => ley.activa && ley.objetivo === objetivo);
  }

  /** Factor combinado de las leyes activas de la nación para un objetivo. */
  factorLeyes(objetivo: ObjetivoLey): number {
    return this.leyesDe(objetivo).reduce((factor, ley) => factor + ley.factor(), 0);
  }
}

export default Nacion;
