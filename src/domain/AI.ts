import type Agente from "./Agente";
import type Empleado from "./Empleado";
import type Empresa from "./Empresa";
import type Ley from "./Ley";
import type Mercado from "./Mercado";
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
  /** Productividad propia de la IA (0–2), igual que una empresa. */
  productividad: number;
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
    productividad: number = 1,
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
    this.productividad = productividad;
    // Formato: <iniciales del modelo>-<id>  (ej: CL-k3f9a1).
    this.id = `${iniciales(modelo)}-${idAleatorio()}`;
    this.agentes = [];
    this.propiedades = [];
    this.empleados = [];
    this.empresas = [];
  }

  /**
   * Sueldo de la AI afectado por las leyes de la empresa matriz y por la
   * productividad global.
   */
  sueldoConLeyes(leyesGlobales: Ley[] = [], productividadGlobal: number = 1): Sueldo {
    const factor = this.empresaMatriz.factorLeyes("ai", leyesGlobales);
    return new Sueldo(this.sueldoBase, false, "variable")
      .conLeyes(factor)
      .escalar(productividadGlobal);
  }

  /** Agentes de la AI filtrados por sector. */
  agentesDeSector(sector: string): Agente[] {
    return this.agentes.filter((agente) => agente.sector === sector);
  }

  /**
   * Adquiere una empresa a través del mercado. El pago sale del capital de la
   * empresa matriz y la empresa adquirida se registra en `empresas`.
   */
  adquirir(mercado: Mercado, objetivo: Empresa): { ok: boolean; costo: number; motivo?: string } {
    return mercado.adquirir(this, objetivo);
  }
}

export default AI;
