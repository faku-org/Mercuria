import Ambiente from "../domain/Ambiente";
import Economia from "../domain/Economia";
import recursos from "./recursosBase";

const ambienteDemo = new Ambiente(0.12, 0, 0.88);

const economiaDemo = new Economia(recursos, ambienteDemo);

export { ambienteDemo, economiaDemo };
export default economiaDemo;
