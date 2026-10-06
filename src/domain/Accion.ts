import type Empresa from "./Empresa";

/** Cotización de una empresa en el mercado. */
class Accion {
  empresa: Empresa;
  precio: number;
  precioAnterior: number;
  precioInicial: number;
  cantidad: number;

  constructor(empresa: Empresa, precio: number, cantidad: number) {
    this.empresa = empresa;
    this.precio = precio;
    this.precioAnterior = precio;
    this.precioInicial = precio;
    this.cantidad = cantidad;
  }

  /** Capitalización bursátil: precio × acciones en circulación. */
  get capitalizacion(): number {
    return Number((this.precio * this.cantidad).toFixed(2));
  }

  /** Variación respecto del período anterior (0.05 = +5%). */
  get variacion(): number {
    return this.precioAnterior === 0
      ? 0
      : Number((this.precio / this.precioAnterior - 1).toFixed(6));
  }

  /** Índice normalizado respecto del precio inicial (1 = sin cambios). */
  get indice(): number {
    return this.precioInicial === 0 ? 1 : Number((this.precio / this.precioInicial).toFixed(6));
  }

  /** Fija un nuevo precio, guardando el anterior. */
  cotizar(nuevoPrecio: number): void {
    this.precioAnterior = this.precio;
    this.precio = Number(Math.max(0.01, nuevoPrecio).toFixed(4));
  }
}

export default Accion;
