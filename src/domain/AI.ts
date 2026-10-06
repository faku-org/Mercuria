// Modelo de dominio pendiente de implementar.
// Ver docs/dominio.md (AI).

import type Agente from "./Agente";

class AI {
  nombre: string;
  modelo: string;
  id: string;
  empresaMatriz: string;
  asi: boolean;
  rogue: boolean;
  agentes: Agente[];

  constructor(
    nombre: string,
    modelo: string,
    empresaMatriz: string,
    rogue: boolean = false,
    asi: boolean = false,
  ) {
    this.nombre = nombre;
    this.modelo = modelo;
    this.id =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.empresaMatriz = empresaMatriz;
    this.rogue = rogue;
    this.asi = asi;
    this.agentes = [];
  }
}

export default AI;
