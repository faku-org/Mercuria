// Predicción por simulación aislada.
//
// Corre la simulación hacia adelante sobre una **copia** del mundo, sin tocar
// el estado real: clonamos recursos, ambiente, empresas y mercado, avanzamos N
// períodos y devolvemos el histórico proyectado.
//
// La copia no necesita naciones, propiedades ni empleados: el ciclo de
// `services/simulacion.ts` solo lee economía (recursos + ambiente), empresas
// (capital, productividad, capacidad, emisión) y mercado (cotizaciones).

import Ambiente from "../domain/Ambiente";
import Economia, { type PuntoEconomico } from "../domain/Economia";
import Empresa from "../domain/Empresa";
import Mercado from "../domain/Mercado";
import Recurso, { type TipoRecurso } from "../domain/Recurso";
import { avanzarPeriodos } from "./simulacion";

/** Lo mínimo que la simulación necesita del mundo, real o clonado. */
interface MundoPredecible {
  economia: Economia;
  empresas: Empresa[];
  mercado: Mercado;
}

/**
 * Copia profunda y **aislada** del mundo simulado. Los objetos resultantes no
 * comparten referencias con los originales, así que avanzar la copia no altera
 * el mundo real.
 */
function clonarMundo(mundo: MundoPredecible): MundoPredecible {
  const { economia, empresas, mercado } = mundo;

  const recursos = economia.recursos.map(
    (recurso) =>
      new Recurso(recurso.nombre, recurso.tipo as TipoRecurso, recurso.unidad, {
        disponibilidad: recurso.disponibilidad,
        regeneracion: recurso.regeneracion,
        consumoBase: recurso.consumoBase,
        precioBase: recurso.precioBase,
      }),
  );

  const ambiente = new Ambiente(
    economia.ambiente.contaminacion,
    economia.ambiente.temperatura,
    economia.ambiente.biodiversidad,
  );

  const economiaCopia = new Economia(recursos, ambiente);
  economiaCopia.periodo = economia.periodo;
  economiaCopia.pibGlobal = economia.pibGlobal;
  economiaCopia.pibAnterior = economia.pibAnterior;
  economiaCopia.crecimiento = economia.crecimiento;
  economiaCopia.productividadGlobal = economia.productividadGlobal;

  const porEmpresa = new Map<Empresa, Empresa>();
  const empresasCopia = empresas.map((empresa) => {
    const copia = new Empresa(empresa.nombre, empresa.id, [], empresa.capital, [], {
      productividad: empresa.productividad,
      capacidad: empresa.capacidad,
      acciones: empresa.acciones,
      intensidadEmision: empresa.intensidadEmision,
    });
    porEmpresa.set(empresa, copia);
    return copia;
  });

  const mercadoCopia = new Mercado();
  for (const empresa of empresas) {
    const cotizacion = mercado.cotizacionDe(empresa);
    const copia = porEmpresa.get(empresa);
    if (!cotizacion || !copia) continue;
    const accion = mercadoCopia.listarEmpresa(copia, cotizacion.precio, cotizacion.cantidad);
    accion.precioAnterior = cotizacion.precioAnterior;
    accion.precioInicial = cotizacion.precioInicial;
  }

  return { economia: economiaCopia, empresas: empresasCopia, mercado: mercadoCopia };
}

/**
 * Proyecta el mundo `periodos` hacia adelante y devuelve las muestras del
 * histórico proyectado (una por período). No modifica `mundo`.
 */
function predecir(mundo: MundoPredecible, periodos: number): PuntoEconomico[] {
  const cantidad = Math.max(0, Math.floor(periodos));
  if (cantidad === 0) return [];
  const copia = clonarMundo(mundo);
  avanzarPeriodos(copia, cantidad);
  return copia.economia.historico;
}

export { predecir, clonarMundo, type MundoPredecible };
export default predecir;
