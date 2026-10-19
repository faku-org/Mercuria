import type { Aleatorio } from "../domain/contratosTecnologia";

/**
 * Generador mulberry32: rápido, de 32 bits y con un único entero de estado, lo que
 * lo hace trivial de persistir. No es criptográfico (no hace falta).
 */
function crearAleatorio(semilla: number): Aleatorio {
  let a = semilla >>> 0;
  return {
    siguiente() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    estado: () => a,
  };
}

/** Retoma una secuencia desde un estado guardado con `Aleatorio.estado()`. */
function restaurarAleatorio(estado: number): Aleatorio {
  return crearAleatorio(estado);
}

/** Número con distribución normal estándar (Box-Muller). Consume dos valores. */
function normal(aleatorio: Aleatorio): number {
  const u = Math.max(aleatorio.siguiente(), Number.EPSILON);
  const v = aleatorio.siguiente();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export { crearAleatorio, normal, restaurarAleatorio };
export default crearAleatorio;
