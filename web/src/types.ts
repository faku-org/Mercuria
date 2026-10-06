// Tipos espejo de los DTOs que devuelve la API (src/server/mundo.ts).

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

export interface Estado extends Nacion {
  nacion: string;
}

export interface Empleado {
  id: number;
  nombre: string;
  tipo: string;
  tipoSueldo: string;
  sueldoBase: number;
  factorLeyes: number;
  sueldoFinal: number;
  empresa: string;
}

export interface LineaNomina {
  id: number;
  nombre: string;
  tipo: string;
  tipoSueldo: string;
  sueldoBase: number;
  factorLeyes: number;
  sueldoFinal: number;
}

export interface Nomina {
  lineas: LineaNomina[];
  totalBase: number;
  totalFinal: number;
}

export interface Propiedad {
  id: string;
  nombre: string;
  precio: number;
  precioConLeyes: number;
  nacion: string;
  estado: string | null;
  dueño: string | null;
}

export interface Empresa {
  nombre: string;
  id: number;
  capital: number;
  nacion: string | null;
  estado: string | null;
  jefe: string | null;
  empleados: Empleado[];
  propiedades: Propiedad[];
  ai: string | null;
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
  empresaMatriz: string;
  asi: boolean;
  rogue: boolean;
  sueldoBase: number;
  sueldoFinal: number;
  agentes: Agente[];
}

export interface ResumenLeyes {
  total: number;
  activas: number;
  factores: Record<ObjetivoLey, number>;
}

export interface Mundo {
  generado: string;
  naciones: Nacion[];
  estados: Estado[];
  leyes: Ley[];
  resumenLeyes: ResumenLeyes;
  empresas: Empresa[];
  empleados: Empleado[];
  nomina: Nomina;
  propiedades: Propiedad[];
  ais: AIInfo[];
}
