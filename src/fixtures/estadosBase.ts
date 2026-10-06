import Estado from "../domain/Estado";
import { nacionPrincipal, nacionSecundaria } from "./nacionesBase";

const california = new Estado("California", "Sacramento", "English", 39_000_000, nacionPrincipal);
const montevideo = new Estado("Montevideo", "Montevideo", "Español", 1_300_000, nacionSecundaria);

const estados: Estado[] = [california, montevideo];

export { california, montevideo };
export default estados;
