// Reloj de la simulación: hace avanzar el mundo solo, a la velocidad elegida.
//
// El estado vive en el servidor (una sola fuente de verdad para todos los
// clientes). Cada tick avanza `periodosPorTick` períodos y publica el cambio;
// para no golpear SQLite en cada cuadro, persiste cada `TICKS_POR_GUARDADO`.

import { avanzar, persistirMundo } from "./mundo";

/** Configuración + contadores del reloj, tal como se expone por GraphQL. */
export interface ConfigSimulacion {
  corriendo: boolean;
  intervaloMs: number;
  periodosPorTick: number;
  ticks: number;
}

const INTERVALO_MIN = 100;
const INTERVALO_MAX = 60_000;
const INTERVALO_DEFECTO = 1_000;
const PERIODOS_TICK_MAX = 50;
const TICKS_POR_GUARDADO = 20;

const config: ConfigSimulacion = {
  corriendo: false,
  intervaloMs: INTERVALO_DEFECTO,
  periodosPorTick: 1,
  ticks: 0,
};

let timer: ReturnType<typeof setInterval> | null = null;
let ticksSinGuardar = 0;

function acotar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, Math.floor(valor)));
}

function detenerTimer(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function tick(): void {
  avanzar(config.periodosPorTick, false);
  config.ticks += 1;
  ticksSinGuardar += 1;
  if (ticksSinGuardar >= TICKS_POR_GUARDADO) {
    persistirMundo();
    ticksSinGuardar = 0;
  }
}

function reiniciarTimer(): void {
  detenerTimer();
  if (!config.corriendo) return;
  timer = setInterval(tick, config.intervaloMs);
}

function guardarPendiente(): void {
  if (ticksSinGuardar > 0) {
    persistirMundo();
    ticksSinGuardar = 0;
  }
}

/** Arranca (o reconfigura) el reloj. */
function iniciar(intervaloMs?: number, periodosPorTick?: number): ConfigSimulacion {
  if (intervaloMs !== undefined) {
    config.intervaloMs = acotar(intervaloMs, INTERVALO_MIN, INTERVALO_MAX);
  }
  if (periodosPorTick !== undefined) {
    config.periodosPorTick = acotar(periodosPorTick, 1, PERIODOS_TICK_MAX);
  }
  config.corriendo = true;
  reiniciarTimer();
  return estado();
}

/** Pausa el reloj y persiste lo que quedó sin guardar. */
function pausar(): ConfigSimulacion {
  config.corriendo = false;
  detenerTimer();
  guardarPendiente();
  return estado();
}

/** Ajusta velocidad/períodos sin cambiar el estado play/pausa. */
function ajustar(intervaloMs?: number, periodosPorTick?: number): ConfigSimulacion {
  if (intervaloMs !== undefined) {
    config.intervaloMs = acotar(intervaloMs, INTERVALO_MIN, INTERVALO_MAX);
  }
  if (periodosPorTick !== undefined) {
    config.periodosPorTick = acotar(periodosPorTick, 1, PERIODOS_TICK_MAX);
  }
  if (config.corriendo) reiniciarTimer();
  return estado();
}

/** Foto del estado actual del reloj. */
function estado(): ConfigSimulacion {
  return { ...config };
}

/** Frena el reloj (para tests o shutdown). */
function detener(): void {
  config.corriendo = false;
  detenerTimer();
}

export { iniciar, pausar, ajustar, estado, detener };
export default estado;
