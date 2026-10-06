import { useState } from "react";
import { Loader2, Play, Sparkles } from "lucide-react";
import * as api from "../api";
import { Sparkline } from "../components/Sparkline";
import {
  Badge,
  Button,
  Card,
  Stat,
  Titulo,
  formatearMoneda,
  formatearNivel,
  formatearNumero,
  formatearPorcentaje,
} from "../components/ui";
import type { Economia, Empresa, Prediccion } from "../types";

type Accion = (fn: () => Promise<unknown>) => Promise<void>;

function AjusteProductividad({ empresa, accion }: { empresa: Empresa; accion: Accion }) {
  const [valor, setValor] = useState(empresa.productividad.toFixed(3));
  return (
    <form
      className="flex items-center gap-2 sm:ml-auto"
      onSubmit={(evento) => {
        evento.preventDefault();
        void accion(() => api.ajustarProductividad(empresa.nombre, Number(valor)));
      }}
    >
      <label className="text-xs text-muted" htmlFor={`prod-${empresa.nombre}`}>
        productividad
      </label>
      <input
        id={`prod-${empresa.nombre}`}
        type="number"
        min="0"
        max="2"
        step="0.05"
        value={valor}
        onChange={(evento) => setValor(evento.target.value)}
        className="tabular w-24 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
      />
      <Button type="submit" variante="secundario">
        Fijar
      </Button>
    </form>
  );
}

/** Predicción aislada: corre la simulación sobre una copia y muestra el resultado. */
function PanelPrediccion({ pibActual }: { pibActual: number }) {
  const [periodos, setPeriodos] = useState(12);
  const [pred, setPred] = useState<Prediccion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const correr = async () => {
    setCargando(true);
    setError(null);
    try {
      setPred(await api.getPrediccion(periodos));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  };

  const variacion = pred && pibActual > 0 ? pred.pibFinal / pibActual - 1 : 0;

  return (
    <Card>
      <Titulo
        accion={
          <form
            className="flex items-center gap-2"
            onSubmit={(evento) => {
              evento.preventDefault();
              void correr();
            }}
          >
            <input
              type="number"
              min="1"
              max="120"
              value={periodos}
              onChange={(evento) => setPeriodos(Number(evento.target.value))}
              className="tabular w-20 rounded-lg border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-accent"
            />
            <Button type="submit" disabled={cargando}>
              {cargando ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Predecir
            </Button>
          </form>
        }
      >
        Predicción (simulación aislada)
      </Titulo>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {pred ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              etiqueta="PIB proyectado"
              valor={formatearMoneda(pred.pibFinal)}
              nota={`${formatearPorcentaje(variacion)} en ${pred.periodos} períodos`}
            />
            <Stat etiqueta="Productividad final" valor={`×${pred.productividadFinal.toFixed(3)}`} />
            <Stat
              etiqueta="Índice de mercado"
              valor={pred.indiceFinal.toFixed(2)}
              nota="base 100"
            />
          </div>
          {pred.puntos.length >= 2 ? (
            <Sparkline
              valores={pred.puntos.map((punto) => punto.pib)}
              ancho={420}
              etiqueta="PIB proyectado"
            />
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">
          Se corre la simulación sobre una copia del mundo: no toca el estado real.
        </p>
      )}
    </Card>
  );
}

export function EconomiaView({
  economia,
  empresas,
  accion,
}: {
  economia: Economia;
  empresas: Empresa[];
  accion: Accion;
}) {
  const historico = economia.historico;

  return (
    <div className="space-y-5">
      <PanelPrediccion pibActual={economia.pibGlobal} />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat
          etiqueta="PIB global"
          valor={formatearMoneda(economia.pibGlobal)}
          nota={`${formatearPorcentaje(economia.crecimiento)} vs período anterior`}
        />
        <Stat
          etiqueta="Productividad global"
          valor={`×${formatearNumero(economia.productividadGlobal, 3)}`}
          nota="escala todos los sueldos"
        />
        <Stat etiqueta="Período" valor={String(economia.periodo)} nota="persistido en SQLite" />
        <Stat
          etiqueta="Disponibilidad de recursos"
          valor={formatearNivel(economia.disponibilidadMedia)}
          nota={`factor ${formatearNumero(economia.factorRecursos, 3)}`}
        />
      </div>

      <Card>
        <Titulo
          accion={
            <div className="flex gap-2">
              <Button onClick={() => void accion(() => api.avanzarPeriodo(1))}>
                <Play size={15} /> 1 período
              </Button>
              <Button
                variante="secundario"
                onClick={() => void accion(() => api.avanzarPeriodo(10))}
              >
                <Play size={15} /> 10 períodos
              </Button>
            </div>
          }
        >
          Histórico de la simulación
        </Titulo>
        {historico.length < 2 ? (
          <p className="text-sm text-muted">Corré algunos períodos para ver la evolución.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            <Sparkline valores={historico.map((punto) => punto.pib)} etiqueta="PIB global" />
            <Sparkline
              valores={historico.map((punto) => punto.productividadGlobal)}
              etiqueta="Productividad global"
            />
            <Sparkline
              valores={historico.map((punto) => punto.indiceMercado)}
              etiqueta="Índice de mercado"
            />
          </div>
        )}
      </Card>

      <Card>
        <Titulo>Productividad por empresa</Titulo>
        <ul className="divide-y divide-line text-sm">
          {empresas.map((empresa) => (
            <li
              key={empresa.nombre}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
            >
              <span className="font-medium sm:min-w-36">{empresa.nombre}</span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tono="acento">×{formatearNumero(empresa.productividad, 3)}</Badge>
                <span className="text-xs text-muted sm:text-sm">
                  aporte al PIB {formatearMoneda(empresa.aportePib)}
                </span>
              </div>
              <AjusteProductividad empresa={empresa} accion={accion} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          La productividad converge al techo de cada empresa ajustado por recursos y ambiente.
        </p>
      </Card>
    </div>
  );
}
