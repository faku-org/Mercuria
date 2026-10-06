import type Agente from "./Agente";
import type Empleado from "./Empleado";
import type Empresa from "./Empresa";
import type Ley from "./Ley";
import type Propiedad from "./Propiedad";
import Sueldo from "./Sueldo";
import { iniciales, idAleatorio } from "./identificadores";

class AI {
  nombre: string;
  modelo: string;
  id: string;
  empresaMatriz: Empresa;
  sueldoBase: number;
  asi: boolean;
  rogue: boolean;
  agentes: Agente[];
  propiedades: Propiedad[];
  empleados: Empleado[];
  empresas: Empresa[];

  constructor(
    nombre: string,
    modelo: string,
    empresaMatriz: Empresa,
    sueldoBase: number = 0,
    rogue: boolean = false,
    asi: boolean = false,
  ) {
    // Una AI siempre debe haber sido creada por una empresa.
    if (!empresaMatriz) {
      throw new Error("Toda AI debe haber sido creada por una empresa.");
    }
    this.nombre = nombre;
    this.modelo = modelo;
    this.empresaMatriz = empresaMatriz;
    this.sueldoBase = sueldoBase;
    this.rogue = rogue;
    this.asi = asi;
    // Formato: <iniciales del modelo>-<id>  (ej: CL-k3f9a1).
    this.id = `${iniciales(modelo)}-${idAleatorio()}`;
    this.agentes = [];
    this.propiedades = [];
    this.empleados = [];
    this.empresas = [];
  }

  /** Sueldo de la AI afectado por las leyes de la empresa matriz. */
  sueldoConLeyes(leyesGlobales: Ley[] = []): Sueldo {
    const factor = this.empresaMatriz.factorLeyes("ai", leyesGlobales);
    return new Sueldo(this.sueldoBase, false, "variable").conLeyes(factor);
  }

  /** Agentes de la AI filtrados por sector. */
  agentesDeSector(sector: string): Agente[] {
    return this.agentes.filter((agente) => agente.sector === sector);
  }
}

export default AI;
