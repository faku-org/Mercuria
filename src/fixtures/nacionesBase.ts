import Nacion from "../domain/Nacion";

const nacionPrincipal = new Nacion("United States", "Washington", "English", 331_000_000);
const nacionSecundaria = new Nacion("Uruguay", "Montevideo", "Español", 3_400_000);

const naciones: Nacion[] = [nacionPrincipal, nacionSecundaria];

export { nacionPrincipal, nacionSecundaria };
export default naciones;
