// Reloj de la simulación: hace avanzar el mundo solo, a la velocidad elegida.
//
// La economía avanza aunque no haya ningún cliente conectado: el reloj vive en
// el servidor. `POLIMORFISMO_TICK_MS` ajusta el intervalo (default 30 s) y
// `POLIMORFISMO_SIM_AUTOSTART=0` desactiva el arranque automático (tests).

import { avanzar, persistirMundo } from "./mundo";

/** Configuración + contadores del reloj, tal como se expone por GraphQL. */
export interface ConfigSimulacion {
  corriendo: boolean;
  intervaloMs: number;
  periodosPorTick: number;
  ticks: number;
}

const INTERVALO_MIN = 100;
const INTERVALO_MAX = 600_000;
const PERIODOS_TICK_MAX = 50;
/** Con cadencia rápida no se guarda en cada tick para no golpear SQLite. */
const TICKS_RAPIDOS_POR_GUARDADO = 20;
const CADENCIA_LENTA_MS = 1_000;

function leerEnteroEnv(nombre: string, porDefecto: number): number {
  const bruto = process.env[nombre];
  const valor = bruto === undefined ? Number.NaN : Number(bruto);
  return Number.isFinite(valor) ? valor : porDefecto;
}

function acotar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, Math.floor(valor)));
}

const INTERVALO_DEFECTO = acotar(
  leerEnteroEnv("POLIMORFISMO_TICK_MS", 30_000),
  INTERVALO_MIN,
  INTERVALO_MAX,
);
const AUTOSTART = process.env.POLIMORFISMO_SIM_AUTOSTART !== "0";

const config: ConfigSimulacion = {
  corriendo: false,
  intervaloMs: INTERVALO_DEFECTO,
  periodosPorTick: 1,
  ticks: 0,
};

let timer: ReturnType<typeof setInterval> | null = null;
let ticksSinGuardar = 0;

/** Cada cuántos ticks se persiste: en cada uno con cadencia lenta. */
function ticksPorGuardado(): number {
  return config.intervaloMs >= CADENCIA_LENTA_MS ? 1 : TICKS_RAPIDOS_POR_GUARDADO;
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
  if (ticksSinGuardar >= ticksPorGuardado()) {
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

/** Arranca el reloj al levantar el servidor, salvo que el autostart esté apagado. */
function autostart(): ConfigSimulacion {
  if (!AUTOSTART) return estado();
  return iniciar();
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

export { iniciar, autostart, pausar, ajustar, estado, detener };
export default estado;
