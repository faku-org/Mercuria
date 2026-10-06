// Tipos espejo del esquema GraphQL (src/server/schema.ts).

export type ObjetivoLey = "sueldo" | "empresa" | "propiedad" | "ai";
export type EfectoLey = "positivo" | "negativo";
export type AlcanceLey = "nacion" | "estado" | "global";

export interface Ley {
  id: string;
  nombre: string;
  descripcion: string;
  objetivo: ObjetivoLey;
  efecto: EfectoLey;
  magnitud: number;
  alcance: AlcanceLey;
  activa: boolean;
  limite: number | null;
  afecta: string[];
}

export interface Nacion {
  nombre: string;
  id: string;
  iniciales: string;
  capital: string;
  idioma: string;
  poblacion: number;
  leyes: Ley[];
}

export interface Estado {
  nombre: string;
  id: string;
  nacion: string;
  leyes: Ley[];
}

export interface Empleado {
  id: number;
  nombre: string;
  tipo: string;
  tipoSueldo: string;
  sueldoBase: number;
  factorLeyes: number;
  factorProductividad: number;
  sueldoFinal: number;
  empresa?: string;
}

export interface LineaNomina {
  id: number;
  nombre: string;
  tipo: string;
  tipoSueldo: string;
  sueldoBase: number;
  factorLeyes: number;
  factorProductividad: number;
  sueldoFinal: number;
}

export interface Nomina {
  lineas: LineaNomina[];
  totalBase: number;
  totalFinal: number;
  productividadGlobal: number;
}

export interface Propiedad {
  id: string;
  nombre: string;
  precio: number;
  precioConLeyes: number;
  nacion: string;
  estado: string | null;
  duenio: string | null;
}

export interface Empresa {
  nombre: string;
  id: number;
  capital: number;
  productividad: number;
  acciones: number;
  intensidadEmision: number;
  nacion: string | null;
  estado: string | null;
  jefe: string | null;
  ai: string | null;
  capitalizacion: number;
  precioAccion: number | null;
  variacion: number | null;
  valorContable: number;
  aportePib: number;
  esControlada: boolean;
  controladaPor: string | null;
  subsidiarias: string[];
  empleados: Empleado[];
  propiedades: Propiedad[];
  nominaTotal: number;
}

export interface Agente {
  id: string;
  nombre: string;
  modelo: string;
  sector: string;
  productividad: number;
  costoUso: number;
}

export interface AIInfo {
  id: string;
  nombre: string;
  modelo: string;
  productividad: number;
  empresaMatriz: string;
  asi: boolean;
  rogue: boolean;
  sueldoBase: number;
  sueldoFinal: number;
  empresas: string[];
  agentes: Agente[];
}

export interface Recurso {
  id: string;
  nombre: string;
  tipo: string;
  unidad: string;
  disponibilidad: number;
  escasez: number;
  precio: number;
}

export interface Ambiente {
  contaminacion: number;
  calidadAire: number;
  temperatura: number;
  biodiversidad: number;
  impacto: number;
}

export interface PuntoEconomico {
  periodo: number;
  pib: number;
  productividadGlobal: number;
  contaminacion: number;
  indiceMercado: number;
}

export interface Economia {
  periodo: number;
  pibGlobal: number;
  pibAnterior: number;
  crecimiento: number;
  productividadGlobal: number;
  disponibilidadMedia: number;
  factorRecursos: number;
  ambiente: Ambiente;
  recursos: Recurso[];
  historico: PuntoEconomico[];
}

export interface Cotizacion {
  empresa: string;
  precio: number;
  precioAnterior: number;
  cantidad: number;
  capitalizacion: number;
  variacion: number;
  indice: number;
}

export interface Mercado {
  indice: number;
  cotizaciones: Cotizacion[];
}

export interface ResumenLeyes {
  total: number;
  activas: number;
  sueldo: number;
  empresa: number;
  propiedad: number;
  ai: number;
}

export interface Resultado {
  ok: boolean;
  motivo: string | null;
  detalle: string | null;
  costo?: number | null;
}

export interface Mundo {
  naciones: Nacion[];
  estados: Estado[];
  leyes: Ley[];
  resumenLeyes: ResumenLeyes;
  empresas: Empresa[];
  empleados: Empleado[];
  nomina: Nomina;
  propiedades: Propiedad[];
  ais: AIInfo[];
  economia: Economia;
  mercado: Mercado;
}
