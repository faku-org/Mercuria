// Modelo de dominio pendiente de implementar.
// Ver docs/dominio.md (Agentes).

import AI from "./AI";
import { iniciales, idAleatorio } from "./identificadores";

class Agente extends AI {
  aiMatriz: AI;

  constructor(
    nombre: string,
    modelo: string,
    aiMatriz: AI,
    rogue: boolean = false,
    asi: boolean = false,
  ) {
    super(nombre, modelo, aiMatriz.empresaMatriz, rogue, asi);
    this.aiMatriz = aiMatriz;
    // Formato: <iniciales del modelo>-<id>  (ej: CL-k3f9a1).
    this.id = `${iniciales(modelo)}-${idAleatorio()}`;
    // El agente queda registrado en su AI matriz al crearse.
    aiMatriz.agentes.push(this);
  }
}

export default Agente;
