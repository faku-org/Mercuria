import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Pause, Play, RotateCcw, StepForward, Table2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  formatearMoneda,
  formatearNivel,
  formatearNumero,
  formatearPorcentaje,
} from "../components/ui";
import {
  PALANCAS_BASE,
  avanzarPeriodo,
  capitalizacion,
  crearMundo,
  type MundoSim,
  type Palancas,
} from "../sim/motor";
import { GraficoSerie } from "./GraficoSerie";

/** Períodos que ya tiene el mundo al arrancar, igual que el servidor al sembrar. */
const PERIODOS_SEMBRADO = 12;
/** Tope de la demo para que las series sigan siendo legibles. */
const PERIODOS_MAXIMOS = 200;

const VELOCIDADES = [
  { id: "lenta", etiqueta: "×1", ms: 500 },
  { id: "media", etiqueta: "×4", ms: 125 },
  { id: "rapida", etiqueta: "×10", ms: 50 },
] as const;

const ESCENARIOS: {
  id: string;
  nombre: string;
  descripcion: string;
  palancas: Palancas;
}[] = [
  {
    id: "base",
    nombre: "Base",
    descripcion: "Los parámetros reales del modelo.",
    palancas: PALANCAS_BASE,
  },
  {
    id: "presion",
    nombre: "Presión",
    descripcion: "Consumo y emisiones ×3, regeneración a la mitad.",
    palancas: { consumo: 3, emision: 3, regeneracion: 0.5 },
  },
  {
    id: "sostenible",
    nombre: "Sostenible",
    descripcion: "Menos consumo y emisiones, más regeneración.",
    palancas: { consumo: 0.5, emision: 0.3, regeneracion: 1.5 },
  },
];

const CONTROLES: { clave: keyof Palancas; etiqueta: string; ayuda: string; max: number }[] = [
  { clave: "consumo", etiqueta: "Consumo de recursos", ayuda: "por unidad producida", max: 4 },
  { clave: "emision", etiqueta: "Emisiones", ayuda: "contaminación por producción", max: 4 },
  {
    clave: "regeneracion",
    etiqueta: "Regeneración",
    ayuda: "de los recursos, por período",
    max: 3,
  },
];

function semilla(): MundoSim {
  const mundo = crearMundo();
  for (let i = 0; i < PERIODOS_SEMBRADO; i += 1) avanzarPeriodo(mundo);
  return mundo;
}

const millones = (valor: number) => `${formatearNumero(valor / 1_000_000, 2)} M`;

function variacionDe(
  valores: number[],
  relativa: boolean,
): {
  texto: string;
  tono: "positivo" | "negativo" | "neutro";
} {
  const primero = valores[0];
  const ultimo = valores[valores.length - 1];
  if (primero === undefined || ultimo === undefined || valores.length < 2) {
    return { texto: "sin cambio", tono: "neutro" };
  }
  const delta = relativa ? (primero === 0 ? 0 : ultimo / primero - 1) : ultimo - primero;
  const texto = relativa
    ? formatearPorcentaje(delta)
    : `${delta > 0 ? "+" : ""}${formatearNumero(delta, 3)}`;
  return { texto, tono: Math.abs(delta) < 1e-9 ? "neutro" : delta > 0 ? "positivo" : "negativo" };
}

/**
 * Demo interactiva. Corre `motor.ts` (port del ciclo del backend) en el navegador:
 * con las palancas en ×1 produce exactamente la misma trayectoria que el servidor.
 */
export function Simulador() {
  const mundoRef = useRef<MundoSim>(semilla());
  const [, redibujar] = useReducer((n: number) => n + 1, 0);
  const [corriendo, setCorriendo] = useState(false);
  const [velocidad, setVelocidad] = useState<(typeof VELOCIDADES)[number]["id"]>("media");
  const [palancas, setPalancas] = useState<Palancas>(PALANCAS_BASE);
  const [vistaTabla, setVistaTabla] = useState(false);
  const palancasRef = useRef(palancas);
  palancasRef.current = palancas;

  const mundo = mundoRef.current;
  const alTope = mundo.periodo >= PERIODOS_MAXIMOS;

  const paso = useCallback((cantidad: number) => {
    const m = mundoRef.current;
    for (let i = 0; i < cantidad && m.periodo < PERIODOS_MAXIMOS; i += 1) {
      avanzarPeriodo(m, palancasRef.current);
    }
    redibujar();
  }, []);

  useEffect(() => {
    if (!corriendo) return;
    if (alTope) {
      setCorriendo(false);
      return;
    }
    const ms = VELOCIDADES.find((v) => v.id === velocidad)?.ms ?? 125;
    const id = setInterval(() => paso(1), ms);
    return () => clearInterval(id);
  }, [corriendo, velocidad, alTope, paso]);

  const reiniciar = (nuevas: Palancas = PALANCAS_BASE) => {
    mundoRef.current = semilla();
    setPalancas(nuevas);
    palancasRef.current = nuevas;
    setCorriendo(false);
    redibujar();
  };

  const escenarioActivo = ESCENARIOS.find(
    (e) =>
      e.palancas.consumo === palancas.consumo &&
      e.palancas.emision === palancas.emision &&
      e.palancas.regeneracion === palancas.regeneracion,
  );

  const h = mundo.historico;
  const series = {
    pib: h.map((p) => p.pib),
    productividad: h.map((p) => p.productividadGlobal),
    contaminacion: h.map((p) => p.contaminacion),
    calidadAire: h.map((p) => p.calidadAire),
    temperatura: h.map((p) => p.temperatura),
    indice: h.map((p) => p.indiceMercado),
  };
  // Más contaminación y más temperatura son peores: se invierte el tono de la variación.
  const empeora = (serie: number[]) => {
    const variacion = variacionDe(serie, false);
    const tono =
      variacion.tono === "positivo"
        ? "negativo"
        : variacion.tono === "negativo"
          ? "positivo"
          : "neutro";
    return { ...variacion, tono } as const;
  };

  const cuelloDeBotella = [...mundo.recursos].sort(
    (a, b) => a.disponibilidad - b.disponibilidad,
  )[0];

  return (
    <div className="space-y-4">
      {/* Controles */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setCorriendo((c) => !c)} disabled={alTope}>
            {corriendo ? <Pause size={15} /> : <Play size={15} />}
            {corriendo ? "Pausar" : "Simular"}
          </Button>
          <Button variante="secundario" onClick={() => paso(1)} disabled={corriendo || alTope}>
            <StepForward size={15} /> +1
          </Button>
          <Button variante="secundario" onClick={() => paso(10)} disabled={corriendo || alTope}>
            +10
          </Button>
          <Button variante="secundario" onClick={() => reiniciar(palancas)}>
            <RotateCcw size={15} /> Reiniciar
          </Button>
          <div
            role="group"
            aria-label="Velocidad"
            className="ml-auto flex items-center gap-1 rounded-xl border border-line p-0.5"
          >
            {VELOCIDADES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVelocidad(v.id)}
                aria-pressed={velocidad === v.id}
                className={`tabular rounded-lg px-2.5 py-1 font-mono text-xs transition-colors ${
                  velocidad === v.id ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"
                }`}
              >
                {v.etiqueta}
              </button>
            ))}
          </div>
          <Badge tono="acento">
            <span className="tabular font-mono">período {mundo.periodo}</span>
          </Badge>
        </div>

        <div className="grid gap-4 border-t border-line pt-4 lg:grid-cols-[minmax(0,14rem)_1fr]">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Escenario</p>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              {ESCENARIOS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => reiniciar(e.palancas)}
                  aria-pressed={escenarioActivo?.id === e.id}
                  title={e.descripcion}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    escenarioActivo?.id === e.id
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line hover:bg-canvas"
                  }`}
                >
                  <span className="font-medium">{e.nombre}</span>
                  <span className="hidden text-xs text-muted lg:block">{e.descripcion}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {CONTROLES.map((c) => (
              <label key={c.clave} className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{c.etiqueta}</span>
                  <span className="tabular font-mono text-xs text-accent">
                    ×{formatearNumero(palancas[c.clave], 2)}
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={c.max}
                  step={0.05}
                  value={palancas[c.clave]}
                  onChange={(e) => setPalancas({ ...palancas, [c.clave]: Number(e.target.value) })}
                  className="accent-[var(--color-accent)]"
                />
                <span className="text-xs text-muted">
                  {c.ayuda}. Aplica desde el próximo período.
                </span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Series */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <GraficoSerie
          titulo="PIB global"
          valores={series.pib}
          periodoInicial={0}
          formato={millones}
          actual={millones(mundo.pibGlobal)}
          variacion={variacionDe(series.pib, true)}
        />
        <GraficoSerie
          titulo="Productividad global"
          valores={series.productividad}
          periodoInicial={0}
          formato={(v) => formatearNumero(v, 3)}
          actual={formatearNumero(mundo.productividadGlobal, 3)}
          variacion={variacionDe(series.productividad, false)}
        />
        <GraficoSerie
          titulo="Índice de mercado"
          valores={series.indice}
          periodoInicial={0}
          formato={(v) => formatearNumero(v, 1)}
          actual={formatearNumero(series.indice[series.indice.length - 1] ?? 100, 1)}
          variacion={variacionDe(series.indice, true)}
        />
        <GraficoSerie
          titulo="Calidad del aire · rápida"
          valores={series.calidadAire}
          periodoInicial={0}
          formato={(v) => formatearNivel(v, 1)}
          actual={formatearNivel(mundo.ambiente.calidadAire, 1)}
          variacion={variacionDe(series.calidadAire, false)}
        />
        <GraficoSerie
          titulo="Contaminación acumulada · lenta"
          valores={series.contaminacion}
          periodoInicial={0}
          formato={(v) => formatearNivel(v, 2)}
          actual={formatearNivel(mundo.ambiente.contaminacion, 2)}
          variacion={empeora(series.contaminacion)}
        />
        <GraficoSerie
          titulo="Temperatura · lenta"
          valores={series.temperatura}
          periodoInicial={0}
          formato={(v) => `+${formatearNumero(v, 2)} °C`}
          actual={`+${formatearNumero(mundo.ambiente.temperatura, 2)} °C`}
          variacion={empeora(series.temperatura)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recursos */}
        <Card>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-base font-semibold">Recursos</h3>
            <span className="text-xs text-muted">disponibilidad · 1,00 = referencia</span>
          </div>
          <ul className="space-y-3">
            {mundo.recursos.map((r) => {
              const pct = (r.disponibilidad / 2) * 100;
              const escaso = r.disponibilidad < 0.5;
              return (
                <li key={r.id}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span>{r.nombre}</span>
                    <span className="tabular font-mono text-xs">
                      <span className={escaso ? "text-negative" : ""}>
                        {formatearNumero(r.disponibilidad, 2)}
                      </span>
                      <span className="text-muted">
                        {" · "}
                        {formatearMoneda(r.precio)}/{r.unidad}
                      </span>
                    </span>
                  </div>
                  <div
                    className="relative h-2 rounded-full bg-canvas"
                    role="meter"
                    aria-label={`Disponibilidad de ${r.nombre}`}
                    aria-valuemin={0}
                    aria-valuemax={2}
                    aria-valuenow={Number(r.disponibilidad.toFixed(2))}
                  >
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-200"
                      style={{ width: `${pct}%` }}
                    />
                    <span
                      className="absolute -top-0.5 h-3 w-px bg-ink/40"
                      style={{ left: "50%" }}
                      aria-hidden="true"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {cuelloDeBotella ? (
            <p className="mt-4 text-sm text-muted">
              Cuello de botella:{" "}
              <strong className="font-semibold text-ink">{cuelloDeBotella.nombre}</strong> con{" "}
              <span className="tabular font-mono">
                {formatearNumero(cuelloDeBotella.disponibilidad, 2)}
              </span>
              . Cada recurso entra a la producción como su raíz cuadrada.
            </p>
          ) : null}
        </Card>

        {/* Empresas */}
        <Card>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-base font-semibold">Empresas</h3>
            <span className="text-xs text-muted">productividad y cotización</span>
          </div>
          <ul className="space-y-3">
            {mundo.empresas.map((e) => {
              const variacion = e.precioAnterior === 0 ? 0 : e.precio / e.precioAnterior - 1;
              const techo = e.capacidad;
              return (
                <li key={e.nombre}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{e.nombre}</span>
                    <span className="tabular font-mono text-xs">
                      {formatearMoneda(e.precio)}{" "}
                      <span className={variacion >= 0 ? "text-positive" : "text-negative"}>
                        {formatearPorcentaje(variacion, 2)}
                      </span>
                    </span>
                  </div>
                  <div
                    className="relative h-2 rounded-full bg-canvas"
                    role="meter"
                    aria-label={`Productividad de ${e.nombre}`}
                    aria-valuemin={0}
                    aria-valuemax={2}
                    aria-valuenow={Number(e.productividad.toFixed(3))}
                  >
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-200"
                      style={{ width: `${(e.productividad / 2) * 100}%` }}
                    />
                    <span
                      className="absolute -top-0.5 h-3 w-px bg-ink/40"
                      style={{ left: `${(techo / 2) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="tabular mt-1 font-mono text-[11px] text-muted">
                    productividad {formatearNumero(e.productividad, 3)} · techo{" "}
                    {formatearNumero(techo, 2)} · cap. {millones(capitalizacion(e))}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted">
            La marca vertical es el techo estructural de cada empresa: la productividad converge
            hacia él, pero lo que permiten los recursos y el aire lo achica.
          </p>
        </Card>
      </div>

      {/* Vista de tabla */}
      <div>
        <button
          type="button"
          onClick={() => setVistaTabla((v) => !v)}
          aria-expanded={vistaTabla}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
        >
          <Table2 size={15} /> {vistaTabla ? "Ocultar" : "Ver"} los datos en tabla
        </button>
        {vistaTabla ? <TablaHistorico mundo={mundo} /> : null}
      </div>
    </div>
  );
}

function TablaHistorico({ mundo }: { mundo: MundoSim }) {
  const filas = mundo.historico.slice(-15).reverse();
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="sr-only">Últimos 15 períodos de la simulación</caption>
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 py-2 font-medium">
              Período
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              PIB
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Productividad
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Aire
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Contaminación
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Índice
            </th>
          </tr>
        </thead>
        <tbody className="tabular font-mono text-xs">
          {filas.map((p) => (
            <tr key={p.periodo} className="border-b border-line last:border-0">
              <td className="px-4 py-1.5">{p.periodo}</td>
              <td className="px-4 py-1.5">{millones(p.pib)}</td>
              <td className="px-4 py-1.5">{formatearNumero(p.productividadGlobal, 3)}</td>
              <td className="px-4 py-1.5">{formatearNivel(p.calidadAire, 1)}</td>
              <td className="px-4 py-1.5">{formatearNivel(p.contaminacion, 2)}</td>
              <td className="px-4 py-1.5">{formatearNumero(p.indiceMercado, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
