import Ley from "../domain/Ley";
import { nacionPrincipal } from "./nacionesBase";

const leyes: Ley[] = [
  new Ley(
    "Ley de Protección de Datos",
    "Regula la recopilación, almacenamiento y uso de datos personales.",
    nacionPrincipal,
  ),
  new Ley(
    "Ley de Propiedad Intelectual",
    "Protege los derechos de autor y la propiedad intelectual.",
    nacionPrincipal,
  ),
  new Ley(
    "Ley de Seguridad Laboral",
    "Establece normas para garantizar la seguridad y salud en el trabajo.",
    nacionPrincipal,
  ),
];

export default leyes;
