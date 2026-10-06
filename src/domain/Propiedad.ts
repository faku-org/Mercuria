import type Empresa from "./Empresa";
import type Estado from "./Estado";
import type Ley from "./Ley";
import { factorLeyesGlobales } from "./Ley";
import type Nacion from "./Nacion";
import type Persona from "./Persona";
import { idAleatorio } from "./identificadores";

/** Quién puede ser dueño de una propiedad. */
type Dueño = Persona | Empresa;

interface Ubicacion {
  nacion: Nacion;
  estado?: Estado;
}

class Propiedad {
  nombre: string;
  id: string;
  precio: number;
  nacion: Nacion;
  estado?: Estado;
  dueño: Dueño | null;

  constructor(nombre: string, precio: number, ubicacion: Ubicacion, dueño: Dueño | null = null) {
    this.nombre = nombre;
    this.precio = precio;
    this.nacion = ubicacion.nacion;
    this.estado = ubicacion.estado;
    this.dueño = dueño;
    this.id = `${ubicacion.nacion.iniciales}-PROP-${idAleatorio()}`;
  }

  /** Lugar que manda para las leyes: el estado si lo hay, si no la nación. */
  get ubicacionFiscal(): Nacion | Estado {
    return this.estado ?? this.nacion;
  }

  /** Precio ajustado por las leyes del lugar donde está la propiedad. */
  precioConLeyes(leyesGlobales: Ley[] = []): number {
    const factor =
      this.ubicacionFiscal.factorLeyes("propiedad") +
      factorLeyesGlobales(leyesGlobales, "propiedad");
    return Number((this.precio * (1 + factor)).toFixed(2));
  }

  /**
   * Transfiere el título a otro dueño. La operación económica (capital, cupo)
   * la coordina el servicio o la empresa; acá solo cambia el título.
   */
  vender(nuevoDueño: Dueño | null): void {
    this.dueño = nuevoDueño;
  }
}

export { type Dueño, type Ubicacion };
export default Propiedad;
