import type Economia from "../domain/Economia";
import type Empresa from "../domain/Empresa";
import type Mercado from "../domain/Mercado";

/** Todo lo que la simulación necesita del mundo. */
interface MundoSimulable {
  economia: Economia;
  empresas: Empresa[];
  mercado: Mercado;
}

/**
 * Escalas del modelo. La producción se mide en unidades arbitrarias; estos
 * factores la traducen a consumo de recursos y emisiones del período.
 */
const CONSUMO_POR_PRODUCCION = 1e-9;
const EMISION_POR_PRODUCCION = 1.2e-10;
/** Qué tan rápido la productividad converge a su objetivo (0.15 = 15% de la brecha). */
const CONVERGENCIA_PRODUCTIVIDAD = 0.15;
/** Productividad objetivo con entorno ideal (recursos llenos y aire limpio). */
const PRODUCTIVIDAD_OBJETIVO = 1.2;
/** Reprecio del mercado por período. */
const PESO_CRECIMIENTO = 0.5;
const PESO_PRODUCTIVIDAD = 0.5;

/**
 * Avanza un período del sistema económico:
 * producción → consumo de recursos → emisiones → evolución de productividad →
 * PIB y productividad global → reprecio del mercado → histórico.
 */
function avanzarPeriodo(mundo: MundoSimulable): void {
  const { economia, empresas, mercado } = mundo;

  const factorRecursos = economia.factorRecursos();
  const impacto = economia.ambiente.impacto();

  // 1. Producción de cada empresa (con el entorno del período).
  const produccionPorEmpresa = new Map<Empresa, number>();
  const productividadPrevia = new Map<Empresa, number>();
  for (const empresa of empresas) {
    produccionPorEmpresa.set(empresa, empresa.produccion(factorRecursos, impacto));
    productividadPrevia.set(empresa, empresa.productividad);
  }

  const produccionTotal = [...produccionPorEmpresa.values()].reduce((total, p) => total + p, 0);

  // 2. Consumo de recursos y emisiones.
  for (const recurso of economia.recursos) {
    recurso.consumir(recurso.consumoBase * produccionTotal * CONSUMO_POR_PRODUCCION);
  }
  const emisiones = empresas.reduce(
    (total, empresa) =>
      total + empresa.intensidadEmision * (produccionPorEmpresa.get(empresa) ?? 0),
    0,
  );
  economia.ambiente.registrarEmision(emisiones * EMISION_POR_PRODUCCION);

  // 3. Regeneración natural de los recursos.
  for (const recurso of economia.recursos) {
    recurso.regenerar();
  }

  // 4. La productividad converge hacia lo que el entorno permite a cada empresa.
  const disponibilidad = economia.disponibilidadMedia();
  const entorno = disponibilidad * (1 - impacto);
  for (const empresa of empresas) {
    const objetivo = PRODUCTIVIDAD_OBJETIVO * empresa.capacidad * entorno;
    empresa.variarProductividad(CONVERGENCIA_PRODUCTIVIDAD * (objetivo - empresa.productividad));
  }

  // 5. Productividad global (ponderada) y PIB del período.
  economia.recalcularProductividadGlobal(empresas);
  economia.recalcularPib([...produccionPorEmpresa.values()]);

  // 6. Reprecio del mercado: crecimiento del PIB + cambio de productividad.
  for (const empresa of empresas) {
    const cotizacion = mercado.cotizacionDe(empresa);
    if (!cotizacion) continue;
    const deltaProductividad = empresa.productividad - (productividadPrevia.get(empresa) ?? 0);
    const factor =
      1 + PESO_CRECIMIENTO * economia.crecimiento + PESO_PRODUCTIVIDAD * deltaProductividad;
    cotizacion.cotizar(cotizacion.precio * factor);
  }

  // 7. Cierre del período: muestra para el histórico.
  economia.cerrarPeriodo(mercado.indice());
}

/** Corre varios períodos de una vez. */
function avanzarPeriodos(mundo: MundoSimulable, periodos: number = 1): number {
  const cantidad = Math.max(0, Math.floor(periodos));
  for (let i = 0; i < cantidad; i += 1) {
    avanzarPeriodo(mundo);
  }
  return economia_ultimoPeriodo(mundo);
}

function economia_ultimoPeriodo(mundo: MundoSimulable): number {
  return mundo.economia.periodo;
}

export { avanzarPeriodo, avanzarPeriodos, type MundoSimulable };
export default avanzarPeriodo;
