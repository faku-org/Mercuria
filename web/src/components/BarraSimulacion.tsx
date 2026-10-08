import { Loader2, Pause, Play, Timer, Zap } from "lucide-react";
import type { EstadoSimulacion } from "../types";
import { Badge, Button } from "./ui";

/** Velocidades ofrecidas (intervalo entre ticks). */
const VELOCIDADES = [
  { label: "0,5×", intervaloMs: 2000 },
  { label: "1×", intervaloMs: 1000 },
  { label: "2×", intervaloMs: 500 },
  { label: "5×", intervaloMs: 200 },
  { label: "10×", intervaloMs: 100 },
] as const;

/** Períodos que avanzan por tick. */
const PERIODOS = [1, 2, 5, 10] as const;

const selectClass =
  "rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent";

/**
 * Control global de la simulación: play/pausa, velocidad y períodos por tick.
 * El reloj corre en el servidor; acá solo se manda la intención.
 */
export function BarraSimulacion({
  estado,
  onIniciar,
  onPausar,
  onAjustar,
  ocupado = false,
}: {
  estado: EstadoSimulacion | null;
  onIniciar: (intervaloMs: number, periodosPorTick: number) => void;
  onPausar: () => void;
  onAjustar: (intervaloMs: number, periodosPorTick: number) => void;
  ocupado?: boolean;
}) {
  const corriendo = estado?.corriendo ?? false;
  const intervaloMs = estado?.intervaloMs ?? 1000;
  const periodosPorTick = estado?.periodosPorTick ?? 1;
  const ticks = estado?.ticks ?? 0;

  const cambiarVelocidad = (valor: number) => {
    if (corriendo) onAjustar(valor, periodosPorTick);
  };
  const cambiarPeriodos = (valor: number) => {
    if (corriendo) onAjustar(intervaloMs, valor);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <Badge tono={corriendo ? "positivo" : "neutro"}>
        <span
          className={`h-2 w-2 rounded-full ${corriendo ? "animate-pulse bg-positive" : "bg-muted"}`}
        />
        {corriendo ? "en vivo" : "pausado"}
      </Badge>

      <Button
        variante={corriendo ? "secundario" : "primario"}
        disabled={ocupado}
        onClick={() => {
          if (corriendo) onPausar();
          else onIniciar(intervaloMs, periodosPorTick);
        }}
      >
        {ocupado ? (
          <Loader2 size={15} className="animate-spin" />
        ) : corriendo ? (
          <Pause size={15} />
        ) : (
          <Play size={15} />
        )}
        {corriendo ? "Pausar" : "Iniciar"}
      </Button>

      <label className="flex items-center gap-1.5 text-xs text-muted">
        <Zap size={14} /> Velocidad
        <select
          className={selectClass}
          value={intervaloMs}
          onChange={(evento) => cambiarVelocidad(Number(evento.target.value))}
        >
          {VELOCIDADES.map((velocidad) => (
            <option key={velocidad.intervaloMs} value={velocidad.intervaloMs}>
              {velocidad.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-xs text-muted">
        <Timer size={14} /> Períodos/tick
        <select
          className={selectClass}
          value={periodosPorTick}
          onChange={(evento) => cambiarPeriodos(Number(evento.target.value))}
        >
          {PERIODOS.map((cantidad) => (
            <option key={cantidad} value={cantidad}>
              {cantidad}
            </option>
          ))}
        </select>
      </label>

      <span className="tabular ml-auto text-xs text-muted">{ticks} ticks</span>
    </div>
  );
}
