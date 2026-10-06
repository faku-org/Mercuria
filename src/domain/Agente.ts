import AI from "./AI";
import { iniciales, idAleatorio } from "./identificadores";

/** Costo base de uso por modelo (metáfora de precio por uso). */
const COSTO_POR_MODELO: Record<string, number> = {
  claude: 0.9,
  gpt: 0.7,
  gemini: 0.5,
  llama: 0.2,
};
const COSTO_DEFECTO = 0.3;

/** Costo base del modelo, matcheando por subcadena (ej: "claude-3" → claude). */
function costoModelo(modelo: string): number {
  const clave = Object.keys(COSTO_POR_MODELO).find((candidato) =>
    modelo.toLowerCase().includes(candidato),
  );
  return (clave ? COSTO_POR_MODELO[clave] : COSTO_DEFECTO) ?? COSTO_DEFECTO;
}

class Agente extends AI {
  aiMatriz: AI;
  sector: string;
  productividad: number;

  constructor(
    nombre: string,
    modelo: string,
    aiMatriz: AI,
    sector: string,
    productividad: number = 0.8,
    opciones: { rogue?: boolean; asi?: boolean } = {},
  ) {
    super(
      nombre,
      modelo,
      aiMatriz.empresaMatriz,
      0,
      opciones.rogue ?? false,
      opciones.asi ?? false,
    );
    this.aiMatriz = aiMatriz;
    this.sector = sector;
    this.productividad = productividad;
    // Formato: <iniciales del modelo>-<id>  (ej: CL-k3f9a1).
    this.id = `${iniciales(modelo)}-${idAleatorio()}`;
    // El agente queda registrado en su AI matriz al crearse.
    aiMatriz.agentes.push(this);
  }

  /** Costo de uso según productividad y modelo. */
  costoUso(): number {
    return Number((costoModelo(this.modelo) * this.productividad).toFixed(4));
  }
}

export { costoModelo };
export default Agente;
