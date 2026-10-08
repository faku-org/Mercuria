// Bus de eventos del mundo. Desacopla "el estado cambió" (mutación o tick del
// reloj) de "avisar a los clientes" (el stream SSE). Sin dependencias externas.

/** Función que se llama cada vez que el mundo cambia. */
export type Oyente = () => void;

const oyentes = new Set<Oyente>();

/** Registra un oyente y devuelve la función para darlo de baja. */
export function suscribir(oyente: Oyente): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/** Notifica a todos los oyentes que el mundo cambió. */
export function publicar(): void {
  for (const oyente of oyentes) {
    try {
      oyente();
    } catch {
      // Un cliente roto no debe frenar a los demás.
    }
  }
}

/** Cuántos oyentes hay (útil para tests y diagnóstico). */
export function cantidadOyentes(): number {
  return oyentes.size;
}
