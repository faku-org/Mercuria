import { useState } from "react";
import { Play } from "lucide-react";
import * as api from "../api";
import { Sparkline } from "../components/Sparkline";
import {
  Badge,
  Button,
  Card,
  Stat,
  Titulo,
  formatearMoneda,
  formatearPorcentaje,
} from "../components/ui";
import type { Economia, Empresa } from "../types";

type Accion = (fn: () => Promise<unknown>) => Promise<void>;

function AjusteProductividad({ empresa, accion }: { empresa: Empresa; accion: Accion }) {
  const [valor, setValor] = useState(String(empresa.productividad));
  return (
    <form
      className="ml-auto flex items-center gap-2"
      onSubmit={(evento) => {
        evento.preventDefault();
        void accion(() => api.ajustarProductividad(empresa.nombre, Number(valor)));
      }}
    >
      <input
        type="number"
        min="0"
        max="2"
        step="0.05"
        value={valor}
        onChange={(evento) => setValor(evento.target.value)}
        className="tabular w-24 rounded-lg border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-accent"
      />
      <Button type="submit" variante="secundario">
        Fijar
      </Button>
    </form>
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
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat
          etiqueta="PIB global"
          valor={formatearMoneda(economia.pibGlobal)}
          nota={`${formatearPorcentaje(economia.crecimiento)} vs período anterior`}
        />
        <Stat
          etiqueta="Productividad global"
          valor={`×${economia.productividadGlobal.toFixed(3)}`}
          nota="escala todos los sueldos"
        />
        <Stat etiqueta="Período" valor={String(economia.periodo)} nota="persistido en SQLite" />
        <Stat
          etiqueta="Disponibilidad de recursos"
          valor={`${(economia.disponibilidadMedia * 100).toFixed(1)}%`}
          nota={`factor ${economia.factorRecursos.toFixed(3)}`}
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
            <li key={empresa.nombre} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="min-w-36 font-medium">{empresa.nombre}</span>
              <Badge tono="acento">×{empresa.productividad.toFixed(3)}</Badge>
              <span className="text-muted">aporte al PIB {formatearMoneda(empresa.aportePib)}</span>
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
