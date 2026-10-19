// Mercado de alquiler de cómputo.
//
// Funciones sin estado global. `cotizarAlquiler` es pura (no toca nada); `alquilarComputo`
// la usa y recién después descuenta la capacidad de los datacenters recibidos.
// Ver docs/tecnologia.md, sección 7.

import type Datacenter from "../domain/Datacenter";
import type { TipoRecurso } from "../domain/Recurso";

// Constantes de calibración (propuestas de arranque, se ajustan con tests).
/** Efecto máximo que puede aportar el cómputo alquilado (nunca llega a 1). */
const EFECTO_COMPUTO_MAXIMO = 0.8;
/** Velocidad de saturación del efecto: efecto = MAXIMO × (1 − e^(−K × unidades)). */
const K_EFECTO_COMPUTO = 0.05;

/** Disponibilidades de recursos como índice (1 = normal), por tipo. */
type Disponibilidades = Partial<Record<TipoRecurso, number>>;

type MotivoAlquiler =
  | "cantidad_invalida"
  | "sin_infraestructura"
  | "capacidad_insuficiente"
  | "recursos_insuficientes";

interface FiltroUbicacion {
  nacion?: string;
  estado?: string;
}

/** Tramo del alquiler en un datacenter. */
interface Asignacion {
  datacenterId: string;
  unidades: number;
  precioUnitario: number;
}

type ResultadoAlquiler =
  | {
      ok: true;
      unidades: number;
      costo: number;
      asignaciones: Asignacion[];
      /** Electricidad que pasa a demandar este cómputo por período. */
      demandaEnergia: number;
    }
  | { ok: false; motivo: MotivoAlquiler; recursoFaltante?: TipoRecurso };

/** Cuánto aporta al procesamiento efectivo un volumen de cómputo (rendimientos decrecientes). */
function efectoDeComputo(unidades: number): number {
  if (!(unidades > 0)) return 0;
  return EFECTO_COMPUTO_MAXIMO * (1 - Math.exp(-K_EFECTO_COMPUTO * unidades));
}

/** Electricidad que demandan las unidades dadas por datacenter. */
function demandaEnergia(asignaciones: Asignacion[], datacenters: Datacenter[]): number {
  const porId = new Map(datacenters.map((dc) => [dc.id, dc]));
  return asignaciones.reduce(
    (suma, a) => suma + (porId.get(a.datacenterId)?.demandaElectricidad(a.unidades) ?? 0),
    0,
  );
}

/**
 * Electricidad que demanda todo el cómputo ocupado. Es la entrada del término de
 * contaminación de la IA: emisión = demandaEnergia × intensidad del mix energético.
 */
function demandaEnergiaOcupada(datacenters: Datacenter[]): number {
  return datacenters.reduce((suma, dc) => suma + dc.demandaElectricidad(), 0);
}

/**
 * Calcula si se pueden alquilar `unidades` y cómo se reparten, sin modificar nada.
 * Se llena primero el datacenter más barato. El precio de cada tramo se evalúa a la
 * ocupación media del tramo, así un alquiler grande no sale al precio de un datacenter vacío.
 */
function cotizarAlquiler(
  datacenters: Datacenter[],
  unidades: number,
  disponibilidades: Disponibilidades,
  filtro: FiltroUbicacion = {},
): ResultadoAlquiler {
  if (!Number.isInteger(unidades) || unidades <= 0) {
    return { ok: false, motivo: "cantidad_invalida" };
  }

  const candidatos = datacenters.filter(
    (dc) =>
      (filtro.nacion === undefined || dc.nacion === filtro.nacion) &&
      (filtro.estado === undefined || dc.estado === filtro.estado),
  );
  if (candidatos.length === 0) return { ok: false, motivo: "sin_infraestructura" };

  const libre = candidatos.reduce((suma, dc) => suma + dc.capacidadDisponible(), 0);
  if (libre < unidades) return { ok: false, motivo: "capacidad_insuficiente" };

  const ordenados = [...candidatos].sort((a, b) => a.precioPorUnidad() - b.precioPorUnidad());
  const asignaciones: Asignacion[] = [];
  const necesidad: Disponibilidades = {};
  let restante = unidades;
  let costo = 0;
  let electricidad = 0;

  for (const dc of ordenados) {
    if (restante <= 0) break;
    const tomadas = Math.min(restante, dc.capacidadDisponible());
    if (tomadas <= 0) continue;
    const tasaMedia = (dc.ocupacion + tomadas / 2) / dc.capacidadTotal;
    const precioUnitario = dc.precioConTasa(tasaMedia);
    asignaciones.push({ datacenterId: dc.id, unidades: tomadas, precioUnitario });
    costo += tomadas * precioUnitario;
    electricidad += dc.demandaElectricidad(tomadas);
    for (const [tipo, consumo] of Object.entries(dc.consumoRecursos) as [TipoRecurso, number][]) {
      necesidad[tipo] = (necesidad[tipo] ?? 0) + tomadas * consumo;
    }
    restante -= tomadas;
  }
  necesidad.electricidad = (necesidad.electricidad ?? 0) + electricidad;

  for (const [tipo, requerido] of Object.entries(necesidad) as [TipoRecurso, number][]) {
    if (requerido > 0 && (disponibilidades[tipo] ?? 0) < requerido) {
      return { ok: false, motivo: "recursos_insuficientes", recursoFaltante: tipo };
    }
  }

  return { ok: true, unidades, costo, asignaciones, demandaEnergia: electricidad };
}

/**
 * Alquila cómputo: si la cotización es viable, descuenta la capacidad de los
 * datacenters propietarios. Si falla, no modifica nada.
 */
function alquilarComputo(
  datacenters: Datacenter[],
  unidades: number,
  disponibilidades: Disponibilidades,
  filtro: FiltroUbicacion = {},
): ResultadoAlquiler {
  const resultado = cotizarAlquiler(datacenters, unidades, disponibilidades, filtro);
  if (!resultado.ok) return resultado;
  const porId = new Map(datacenters.map((dc) => [dc.id, dc]));
  for (const asignacion of resultado.asignaciones) {
    porId.get(asignacion.datacenterId)?.reservar(asignacion.unidades);
  }
  return resultado;
}

/** Devuelve a sus propietarios las unidades de un alquiler (fin o cancelación). */
function liberarComputo(datacenters: Datacenter[], asignaciones: Asignacion[]): void {
  const porId = new Map(datacenters.map((dc) => [dc.id, dc]));
  for (const asignacion of asignaciones) {
    porId.get(asignacion.datacenterId)?.liberar(asignacion.unidades);
  }
}

export {
  alquilarComputo,
  cotizarAlquiler,
  demandaEnergia,
  demandaEnergiaOcupada,
  efectoDeComputo,
  liberarComputo,
  type Asignacion,
  type Disponibilidades,
  type FiltroUbicacion,
  type MotivoAlquiler,
  type ResultadoAlquiler,
};
export default alquilarComputo;
