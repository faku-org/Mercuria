import type { TipoRecurso } from "./Recurso";

// Constantes de calibración del datacenter (propuestas de arranque, ver docs/tecnologia.md).
/** Precio por unidad de cómputo con ocupación 0. */
const PRECIO_BASE_DEFECTO = 1;
/** Cuánto sube el precio a ocupación total: precio = base × (1 + PENDIENTE × ocupación²). */
const PENDIENTE_PRECIO = 3;
/** Consumo de electricidad por unidad de cómputo ocupada, por período. */
const CONSUMO_ELECTRICIDAD_DEFECTO = 0.002;

interface OpcionesDatacenter {
  id?: string;
  /** Electricidad que consume cada unidad ocupada. */
  consumoElectricidad?: number;
  /** Otros recursos (por ejemplo agua de refrigeración) que consume cada unidad ocupada. */
  consumoRecursos?: Partial<Record<TipoRecurso, number>>;
  /** Precio por unidad con ocupación 0. */
  precioBase?: number;
  /** Unidades ya ocupadas al crearlo. */
  ocupacion?: number;
}

/**
 * Infraestructura de cómputo alquilable. Vive en una ubicación (nación y estado) sujeta a
 * sus leyes. Su capacidad total se reparte entre ocupada y libre: lo que se alquila se
 * descuenta de la capacidad libre del propietario y el precio sube con la ocupación.
 */
class Datacenter {
  id: string;
  nombre: string;
  nacion: string;
  estado: string;
  /** Capacidad total, en unidades de cómputo. */
  capacidadTotal: number;
  /** Unidades de cómputo ocupadas (alquiladas o en uso propio). */
  ocupacion: number;
  consumoElectricidad: number;
  consumoRecursos: Partial<Record<TipoRecurso, number>>;
  precioBase: number;

  constructor(
    nombre: string,
    nacion: string,
    estado: string,
    capacidadTotal: number,
    opciones: OpcionesDatacenter = {},
  ) {
    this.nombre = nombre;
    this.nacion = nacion;
    this.estado = estado;
    this.capacidadTotal = Math.max(0, capacidadTotal);
    this.id = opciones.id ?? `DC-${nacion}-${estado}-${nombre}`;
    this.consumoElectricidad = opciones.consumoElectricidad ?? CONSUMO_ELECTRICIDAD_DEFECTO;
    this.consumoRecursos = { ...opciones.consumoRecursos };
    this.precioBase = opciones.precioBase ?? PRECIO_BASE_DEFECTO;
    this.ocupacion = Math.min(this.capacidadTotal, Math.max(0, opciones.ocupacion ?? 0));
  }

  /** Unidades todavía libres. */
  capacidadDisponible(): number {
    return this.capacidadTotal - this.ocupacion;
  }

  /** Fracción ocupada, entre 0 y 1. */
  tasaOcupacion(): number {
    return this.capacidadTotal === 0 ? 1 : this.ocupacion / this.capacidadTotal;
  }

  /** Precio por unidad para una tasa de ocupación dada (crece de forma convexa). */
  precioConTasa(tasa: number): number {
    const t = Math.min(1, Math.max(0, tasa));
    return this.precioBase * (1 + PENDIENTE_PRECIO * t * t);
  }

  /** Precio por unidad con la ocupación actual. */
  precioPorUnidad(): number {
    return this.precioConTasa(this.tasaOcupacion());
  }

  /** Ocupa `unidades` si hay lugar; devuelve si lo logró. No modifica nada si falla. */
  reservar(unidades: number): boolean {
    if (!(unidades > 0) || unidades > this.capacidadDisponible()) return false;
    this.ocupacion += unidades;
    return true;
  }

  /** Libera unidades ocupadas; nunca baja de 0. */
  liberar(unidades: number): void {
    this.ocupacion = Math.max(0, this.ocupacion - Math.max(0, unidades));
  }

  /** Electricidad que consume `unidades` de cómputo (por defecto, la ocupación actual). */
  demandaElectricidad(unidades: number = this.ocupacion): number {
    return unidades * this.consumoElectricidad;
  }
}

export { type OpcionesDatacenter };
export default Datacenter;
