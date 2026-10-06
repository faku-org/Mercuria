import type Ley from "./Ley";
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
}

export default Nacion;
