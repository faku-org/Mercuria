import Mercado from "../domain/Mercado";
import empresas from "./empresasBase";

/** Precio inicial de cotización por empresa. */
const PRECIOS_INICIALES: Record<string, number> = {
  "Empresa Demo": 120,
  "Nova Labs": 100,
  "Acero del Sur": 90,
};

const mercadoDemo = new Mercado();

for (const empresa of empresas) {
  mercadoDemo.listarEmpresa(empresa, PRECIOS_INICIALES[empresa.nombre] ?? 100, empresa.acciones);
}

export { PRECIOS_INICIALES };
export default mercadoDemo;
