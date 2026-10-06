import Empresa from "../domain/Empresa";
import { empresaDemo } from "./empleadosBase";
import { california, montevideo } from "./estadosBase";
import { nacionPrincipal, nacionSecundaria } from "./nacionesBase";

/** Empresa tecnológica: poca emisión y alta productividad. */
const empresaTecnologica = new Empresa("Nova Labs", 2, [], 3_000_000, [], {
  nacion: nacionPrincipal,
  estado: california,
  productividad: 1.4,
  acciones: 30_000,
  intensidadEmision: 0.3,
});

/** Industria pesada: mucha emisión y productividad baja. */
const empresaIndustrial = new Empresa("Acero del Sur", 3, [], 8_000_000, [], {
  nacion: nacionSecundaria,
  estado: montevideo,
  productividad: 0.85,
  acciones: 80_000,
  intensidadEmision: 0.9,
});

/** Todas las empresas del mundo simulado. */
const empresas: Empresa[] = [empresaDemo, empresaTecnologica, empresaIndustrial];

export { empresaIndustrial, empresaTecnologica };
export default empresas;
