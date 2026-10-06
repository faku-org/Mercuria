// Utilidades para construir identificadores con formato.
// Ver docs/dominio.md (Identificadores).

/**
 * Deriva las iniciales de un texto.
 * - Varias palabras: la primera letra de cada palabra ("United States" -> "US").
 * - Una sola palabra: sus dos primeras letras ("Claude" -> "CL").
 */
function iniciales(texto: string): string {
  const palabras = texto
    .trim()
    .split(/\s+/)
    .filter((palabra) => palabra.length > 0);

  if (palabras.length === 0) return "XX";

  const soloLetrasYNumeros = (palabra: string) => palabra.replace(/[^\p{L}\p{N}]/gu, "");

  if (palabras.length === 1) {
    const palabra = palabras[0] ?? "";
    return soloLetrasYNumeros(palabra).slice(0, 2).toUpperCase() || "XX";
  }

  const resultado = palabras
    .map((palabra) => soloLetrasYNumeros(palabra).charAt(0))
    .join("")
    .toUpperCase();

  return resultado || "XX";
}

/**
 * Cadena aleatoria corta en base 36 (letras y números).
 */
function idAleatorio(largo: number = 6): string {
  let id = "";
  while (id.length < largo) {
    id += Math.random().toString(36).substring(2);
  }
  return id.substring(0, largo);
}

/**
 * Fecha en formato YYYY-MM-DD.
 */
function fechaId(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export { iniciales, idAleatorio, fechaId };
