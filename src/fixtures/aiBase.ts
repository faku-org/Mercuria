import Agente from "../domain/Agente";
import { empresaDemo } from "./empleadosBase";

const aiCentral = empresaDemo.crearAI("Orion", "Claude 3.5", 120_000);

const agentesDemo: Agente[] = [
  new Agente("Orion Soporte", "Claude 3.5", aiCentral, "soporte", 0.9),
  new Agente("Orion Ventas", "GPT-4o", aiCentral, "ventas", 0.75),
  new Agente("Orion Datos", "Llama 3", aiCentral, "datos", 0.6),
];

export { aiCentral };
export default agentesDemo;
