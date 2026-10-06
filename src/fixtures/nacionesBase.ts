import Nacion from "../domain/Nacion";

const nacionPrincipal = new Nacion("United States", "Washington", "English", 331000000);

const naciones: Nacion[] = [nacionPrincipal];

export { nacionPrincipal };
export default naciones;
