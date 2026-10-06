import { idAleatorio } from "./identificadores";

/** Tipo de recurso básico que consume la producción. */
type TipoRecurso = "agua" | "electricidad" | "combustible" | "minerales";

interface OpcionesRecurso {
  /** Índice de disponibilidad de referencia (1 = normal). */
  disponibilidad?: number;
  /** Cuánto se recupera por período. */
  regeneracion?: number;
  /** Consumo por unidad de producción. */
  consumoBase?: number;
  /** Precio de referencia por unidad. */
  precioBase?: number;
}

class Recurso {
  nombre: string;
  id: string;
  tipo: TipoRecurso;
  unidad: string;
  disponibilidad: number;
  regeneracion: number;
  consumoBase: number;
  precioBase: number;
  precio: number;

  constructor(nombre: string, tipo: TipoRecurso, unidad: string, opciones: OpcionesRecurso = {}) {
    this.nombre = nombre;
    this.tipo = tipo;
    this.unidad = unidad;
    this.disponibilidad = opciones.disponibilidad ?? 1;
    this.regeneracion = opciones.regeneracion ?? 0;
    this.consumoBase = opciones.consumoBase ?? 0;
    this.precioBase = opciones.precioBase ?? 1;
    this.precio = this.precioBase;
    this.id = `REC-${idAleatorio(5)}`;
  }

  /** Escasez normalizada: 0 = hay de sobra, 1 = agotado. */
  escasez(): number {
    return Math.max(0, 1 - this.disponibilidad);
  }

  /** Factor multiplicativo que aplica a la producción (más disponibilidad, más produce). */
  factorProduccion(): number {
    return Math.sqrt(Math.max(this.disponibilidad, 0));
  }

  /** Consume el recurso; nunca baja de 0. */
  consumir(cantidad: number): void {
    this.disponibilidad = Math.max(0, this.disponibilidad - cantidad);
    this.recalcularPrecio();
  }

  /** Regeneración natural por período; nunca pasa de 2. */
  regenerar(): void {
    this.disponibilidad = Math.min(2, this.disponibilidad + this.regeneracion);
    this.recalcularPrecio();
  }

  /** El precio sube con la escasez (2× escasez). */
  recalcularPrecio(): void {
    this.precio = Number((this.precioBase * (1 + 2 * this.escasez())).toFixed(4));
  }
}

export { type OpcionesRecurso, type TipoRecurso };
export default Recurso;
