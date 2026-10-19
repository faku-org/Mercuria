/**
 * Motor de la demo del showcase: port autocontenido de `src/services/simulacion.ts`
 * (`avanzarPeriodo`) y de las reglas de `Recurso`, `Ambiente`, `Economia`, `Accion` y
 * `Empresa.produccion`. Corre en el navegador, sin API.
 *
 * Es una copia deliberada: la UI no importa código del backend. Para que no diverja,
 * `tests/showcase-paridad.test.ts` corre este motor y el del dominio con la misma
 * semilla y compara el histórico período a período. Si cambiás una fórmula en
 * `simulacion.ts`, ese test te avisa que hay que tocar este archivo.
 */

/** Escalas del modelo (idénticas a `services/simulacion.ts`). */
const CONSUMO_POR_PRODUCCION = 1e-9;
const EMISION_POR_PRODUCCION = 1.2e-10;
const CONVERGENCIA_PRODUCTIVIDAD = 0.15;
const PRODUCTIVIDAD_OBJETIVO = 1.2;
const PESO_CRECIMIENTO = 0.5;
const PESO_PRODUCTIVIDAD = 0.5;
const PRODUCTIVIDAD_MAXIMA = 2;
/**
 * Ambiente (idénticas a `domain/Ambiente.ts`; el test de paridad las compara):
 * stock lento que se absorbe de a poco y aire rápido que reacciona al flujo de emisiones.
 */
const ABSORCION_STOCK = 0.005;
const PERSISTENCIA_AIRE = 0.6;
const EMISION_DE_REFERENCIA = 7.5e-4;
const AIRE_DE_REFERENCIA = 0.12;
const SENSIBILIDAD_AIRE = (AIRE_DE_REFERENCIA * (1 - PERSISTENCIA_AIRE)) / EMISION_DE_REFERENCIA;

export interface RecursoSim {
  id: string;
  nombre: string;
  unidad: string;
  disponibilidad: number;
  regeneracion: number;
  consumoBase: number;
  precioBase: number;
  precio: number;
}

export interface AmbienteSim {
  contaminacion: number;
  calidadAire: number;
  temperatura: number;
  biodiversidad: number;
}

export interface EmpresaSim {
  nombre: string;
  capital: number;
  productividad: number;
  /** Techo estructural: la productividad converge hacia `capacidad × entorno`. */
  capacidad: number;
  intensidadEmision: number;
  acciones: number;
  precio: number;
  precioAnterior: number;
  precioInicial: number;
  /** Producción del último período cerrado (para mostrar aportes al PIB). */
  produccion: number;
}

export interface PuntoSim {
  periodo: number;
  pib: number;
  productividadGlobal: number;
  contaminacion: number;
  indiceMercado: number;
  /** Extras de la demo (el histórico del backend no los guarda). */
  calidadAire: number;
  temperatura: number;
}

export interface MundoSim {
  periodo: number;
  pibGlobal: number;
  pibAnterior: number;
  crecimiento: number;
  productividadGlobal: number;
  recursos: RecursoSim[];
  ambiente: AmbienteSim;
  empresas: EmpresaSim[];
  historico: PuntoSim[];
}

/** Palancas de la demo. Con todo en 1 el motor es idéntico al del backend. */
export interface Palancas {
  /** Multiplica el consumo de recursos por unidad de producción. */
  consumo: number;
  /** Multiplica las emisiones de la producción. */
  emision: number;
  /** Multiplica la regeneración natural de los recursos. */
  regeneracion: number;
}

export const CONSTANTES_AMBIENTE = {
  ABSORCION_STOCK,
  PERSISTENCIA_AIRE,
  EMISION_DE_REFERENCIA,
  AIRE_DE_REFERENCIA,
  SENSIBILIDAD_AIRE,
} as const;

export const PALANCAS_BASE: Palancas = { consumo: 1, emision: 1, regeneracion: 1 };

/** Semilla: los mismos valores que `src/fixtures/` (recursos, ambiente, empresas, mercado). */
export const SEMILLA = {
  recursos: [
    {
      id: "agua",
      nombre: "Agua",
      unidad: "m³",
      disponibilidad: 1,
      regeneracion: 0.02,
      consumoBase: 1,
      precioBase: 0.5,
    },
    {
      id: "electricidad",
      nombre: "Electricidad",
      unidad: "kWh",
      disponibilidad: 1,
      regeneracion: 0.03,
      consumoBase: 1.2,
      precioBase: 0.9,
    },
    {
      id: "combustible",
      nombre: "Combustible",
      unidad: "L",
      disponibilidad: 0.8,
      regeneracion: 0.01,
      consumoBase: 1.5,
      precioBase: 1.4,
    },
    {
      id: "minerales",
      nombre: "Minerales",
      unidad: "kg",
      disponibilidad: 0.6,
      regeneracion: 0.005,
      consumoBase: 0.8,
      precioBase: 2.5,
    },
  ],
  ambiente: { contaminacion: 0.12, temperatura: 0, biodiversidad: 0.88 },
  empresas: [
    {
      nombre: "Empresa Demo",
      capital: 5_000_000,
      productividad: 1,
      capacidad: 1,
      intensidadEmision: 0.5,
      acciones: 50_000,
      precio: 120,
    },
    {
      nombre: "Nova Labs",
      capital: 3_000_000,
      productividad: 1.4,
      capacidad: 1.4,
      intensidadEmision: 0.3,
      acciones: 30_000,
      precio: 100,
    },
    {
      nombre: "Acero del Sur",
      capital: 8_000_000,
      productividad: 0.85,
      capacidad: 0.85,
      intensidadEmision: 0.9,
      acciones: 80_000,
      precio: 90,
    },
  ],
} as const;

const redondear = (valor: number, decimales: number): number => Number(valor.toFixed(decimales));
const acotar = (valor: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, valor));

function precioRecurso(recurso: RecursoSim): number {
  const escasez = Math.max(0, 1 - recurso.disponibilidad);
  return redondear(recurso.precioBase * (1 + 2 * escasez), 4);
}

/** Mundo en el período 0, con la semilla de los fixtures. */
export function crearMundo(): MundoSim {
  const contaminacion = SEMILLA.ambiente.contaminacion;
  return {
    periodo: 0,
    pibGlobal: 0,
    pibAnterior: 0,
    crecimiento: 0,
    productividadGlobal: 1,
    recursos: SEMILLA.recursos.map((recurso) => ({ ...recurso, precio: recurso.precioBase })),
    ambiente: {
      contaminacion,
      calidadAire: redondear(1 - contaminacion, 4),
      temperatura: SEMILLA.ambiente.temperatura,
      biodiversidad: SEMILLA.ambiente.biodiversidad,
    },
    empresas: SEMILLA.empresas.map((empresa) => ({
      ...empresa,
      precioAnterior: empresa.precio,
      precioInicial: empresa.precio,
      produccion: 0,
    })),
    historico: [],
  };
}

/** Arrastre ambiental (0..0.9): `producción × (1 − impacto)`. */
export function impacto(ambiente: AmbienteSim): number {
  const bruto =
    ambiente.contaminacion * 0.5 +
    Math.max(0, ambiente.temperatura) * 0.1 +
    (1 - ambiente.calidadAire) * 0.2;
  return redondear(Math.min(0.9, bruto), 6);
}

/** Π disponibilidadᵣ^0.5. */
export function factorRecursos(recursos: RecursoSim[]): number {
  return recursos.reduce(
    (factor, recurso) => factor * Math.sqrt(Math.max(recurso.disponibilidad, 0)),
    1,
  );
}

function disponibilidadMedia(recursos: RecursoSim[]): number {
  if (recursos.length === 0) return 1;
  const suma = recursos.reduce((total, recurso) => total + recurso.disponibilidad, 0);
  return redondear(suma / recursos.length, 6);
}

/** Temperatura y biodiversidad siguen al stock lento de contaminación. */
function sincronizarDerivados(ambiente: AmbienteSim): void {
  ambiente.temperatura = redondear(ambiente.contaminacion * 2, 4);
  ambiente.biodiversidad = redondear(Math.max(0, (1 - ambiente.contaminacion) * 0.9), 4);
}

/** Emisiones del período: suben el stock y la contaminación del aire (que conserva parte). */
function registrarEmision(ambiente: AmbienteSim, intensidad: number): void {
  ambiente.contaminacion = redondear(Math.min(1, ambiente.contaminacion + intensidad), 6);
  const aire = Math.min(
    1,
    (1 - ambiente.calidadAire) * PERSISTENCIA_AIRE + SENSIBILIDAD_AIRE * intensidad,
  );
  ambiente.calidadAire = redondear(Math.max(0, 1 - aire), 4);
  sincronizarDerivados(ambiente);
}

/** Absorción natural del stock por período. */
function absorberStock(ambiente: AmbienteSim): void {
  ambiente.contaminacion = redondear(ambiente.contaminacion * (1 - ABSORCION_STOCK), 6);
  sincronizarDerivados(ambiente);
}

/** Capitalización bursátil de una empresa (`precio × acciones`). */
export function capitalizacion(empresa: EmpresaSim): number {
  return redondear(empresa.precio * empresa.acciones, 2);
}

function indiceAccion(empresa: EmpresaSim): number {
  return empresa.precioInicial === 0 ? 1 : redondear(empresa.precio / empresa.precioInicial, 6);
}

function indiceMercado(empresas: EmpresaSim[]): number {
  if (empresas.length === 0) return 100;
  const suma = empresas.reduce((total, empresa) => total + indiceAccion(empresa), 0);
  return redondear((suma / empresas.length) * 100, 4);
}

/**
 * Avanza un período, en el mismo orden que el backend:
 * producción → consumo y emisiones → absorción y regeneración → productividad → PIB → mercado.
 * Muta `mundo`.
 */
export function avanzarPeriodo(mundo: MundoSim, palancas: Palancas = PALANCAS_BASE): void {
  const { recursos, ambiente, empresas } = mundo;

  const factor = factorRecursos(recursos);
  const arrastre = impacto(ambiente);

  // 1. Producción: capital × productividad × recursos × (1 − ambiente).
  const productividadPrevia = empresas.map((empresa) => empresa.productividad);
  for (const empresa of empresas) {
    const bruta = empresa.capital * empresa.productividad * factor * (1 - arrastre);
    empresa.produccion = redondear(Math.max(0, bruta), 2);
  }
  const produccionTotal = empresas.reduce((total, empresa) => total + empresa.produccion, 0);

  // 2. Consumo de recursos y emisiones.
  for (const recurso of recursos) {
    const consumo =
      recurso.consumoBase * produccionTotal * CONSUMO_POR_PRODUCCION * palancas.consumo;
    recurso.disponibilidad = Math.max(0, recurso.disponibilidad - consumo);
    recurso.precio = precioRecurso(recurso);
  }
  const emisiones = empresas.reduce(
    (total, empresa) => total + empresa.intensidadEmision * empresa.produccion,
    0,
  );
  registrarEmision(ambiente, emisiones * EMISION_POR_PRODUCCION * palancas.emision);
  absorberStock(ambiente);

  // 3. Regeneración natural de los recursos.
  for (const recurso of recursos) {
    recurso.disponibilidad = Math.min(
      2,
      recurso.disponibilidad + recurso.regeneracion * palancas.regeneracion,
    );
    recurso.precio = precioRecurso(recurso);
  }

  // 4. La productividad converge hacia lo que el entorno permite.
  const entorno = disponibilidadMedia(recursos) * (1 - arrastre);
  for (const empresa of empresas) {
    const objetivo = PRODUCTIVIDAD_OBJETIVO * empresa.capacidad * entorno;
    const delta = CONVERGENCIA_PRODUCTIVIDAD * (objetivo - empresa.productividad);
    empresa.productividad = redondear(
      acotar(empresa.productividad + delta, 0, PRODUCTIVIDAD_MAXIMA),
      4,
    );
  }

  // 5. Productividad global (ponderada por capital) y PIB.
  const capitalTotal = empresas.reduce((total, empresa) => total + Math.max(0, empresa.capital), 0);
  mundo.productividadGlobal =
    capitalTotal === 0
      ? 1
      : redondear(
          empresas.reduce(
            (total, empresa) => total + empresa.productividad * Math.max(0, empresa.capital),
            0,
          ) / capitalTotal,
          6,
        );
  mundo.pibAnterior = mundo.pibGlobal;
  mundo.pibGlobal = redondear(
    empresas.reduce((total, empresa) => total + empresa.produccion, 0),
    2,
  );
  mundo.crecimiento =
    mundo.pibAnterior === 0 ? 0 : redondear(mundo.pibGlobal / mundo.pibAnterior - 1, 6);

  // 6. Reprecio del mercado.
  empresas.forEach((empresa, indice) => {
    const delta = empresa.productividad - (productividadPrevia[indice] ?? 0);
    const reprecio = 1 + PESO_CRECIMIENTO * mundo.crecimiento + PESO_PRODUCTIVIDAD * delta;
    empresa.precioAnterior = empresa.precio;
    empresa.precio = redondear(Math.max(0.01, empresa.precio * reprecio), 4);
  });

  // 7. Cierre del período.
  mundo.historico.push({
    periodo: mundo.periodo,
    pib: mundo.pibGlobal,
    productividadGlobal: mundo.productividadGlobal,
    contaminacion: redondear(ambiente.contaminacion, 4),
    indiceMercado: redondear(indiceMercado(empresas), 2),
    calidadAire: ambiente.calidadAire,
    temperatura: ambiente.temperatura,
  });
  mundo.periodo += 1;
}

/** Copia profunda para reiniciar o proyectar sin tocar el original. */
export function clonar(mundo: MundoSim): MundoSim {
  return structuredClone(mundo);
}
