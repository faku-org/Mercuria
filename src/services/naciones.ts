import type Nacion from "../domain/Nacion";

/**
 * Lista las naciones recibidas por consola.
 */
function listarNaciones(naciones: Nacion[]): Nacion[] {
  console.log("Naciones:");
  return naciones.map((nacion) => {
    console.log(`Nombre: ${nacion.nombre}, ID: ${nacion.id}`);
    return nacion;
  });
}

/**
 * Obtiene (y lista) un conjunto de naciones.
 */
function obtenerNaciones(naciones: Nacion[]): Nacion[] {
  return listarNaciones(naciones);
}

export { listarNaciones, obtenerNaciones };
export default listarNaciones;
