import Persona from "../domain/Persona";
import Propiedad from "../domain/Propiedad";
import { california, montevideo } from "./estadosBase";
import { nacionPrincipal, nacionSecundaria } from "./nacionesBase";

const anaDuenia = new Persona(
  "Ana Fija",
  34,
  "30111222",
  new Date("1991-03-12"),
  "Sunset Blvd 100",
  "soltera",
  true,
);

const propiedades: Propiedad[] = [
  new Propiedad("Departamento en Los Ángeles", 220_000, {
    nacion: nacionPrincipal,
    estado: california,
  }),
  new Propiedad("Oficina en Sacramento", 180_000, { nacion: nacionPrincipal, estado: california }),
  new Propiedad(
    "Casa en Montevideo",
    120_000,
    { nacion: nacionSecundaria, estado: montevideo },
    anaDuenia,
  ),
  new Propiedad("Terreno en Washington", 90_000, { nacion: nacionPrincipal }),
];

export { anaDuenia };
export default propiedades;
