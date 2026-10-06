import { useState } from "react";
import { Bot, Plus } from "lucide-react";
import * as api from "../api";
import type { AIInfo } from "../types";
import {
  Badge,
  Button,
  Campo,
  Card,
  Stat,
  Titulo,
  formatearMoneda,
  formatearNivel,
  formatearNumero,
  inputClass,
} from "../components/ui";

type Accion = (fn: () => Promise<unknown>) => Promise<void>;

export function AIView({ ais, accion }: { ais: AIInfo[]; accion: Accion }) {
  const [nombre, setNombre] = useState("");
  const [modelo, setModelo] = useState("Claude 3.5");
  const [sector, setSector] = useState("soporte");
  const [productividad, setProductividad] = useState(0.8);

  const crear = (evento: React.FormEvent) => {
    evento.preventDefault();
    void accion(() => api.crearAgente({ nombre, modelo, sector, productividad }));
    setNombre("");
  };

  return (
    <div className="space-y-5">
      {ais.map((ai) => (
        <Card key={ai.id}>
          <Titulo
            accion={
              <div className="flex gap-2">
                {ai.rogue ? <Badge tono="negativo">rogue</Badge> : null}
                {ai.asi ? <Badge tono="negativo">ASI</Badge> : null}
                <Badge tono="acento">{ai.modelo}</Badge>
              </div>
            }
          >
            {ai.nombre}
          </Titulo>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat etiqueta="Sueldo base" valor={formatearMoneda(ai.sueldoBase)} />
            <Stat etiqueta="Sueldo con leyes" valor={formatearMoneda(ai.sueldoFinal)} />
            <Stat etiqueta="Empresa matriz" valor={ai.empresaMatriz} />
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            <Bot size={13} /> Agentes ({ai.agentes.length})
          </p>
          {/* Móvil: lista. La tabla de 5 columnas no entra en 390px. */}
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line md:hidden">
            {ai.agentes.map((agente) => (
              <li key={agente.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{agente.nombre}</p>
                    <p className="text-xs text-muted">{agente.modelo}</p>
                  </div>
                  <Badge>{agente.sector}</Badge>
                </div>
                <div className="tabular mt-1.5 flex justify-between text-xs text-muted">
                  <span>productividad {formatearNivel(agente.productividad, 0)}</span>
                  <span>costo de uso {formatearNumero(agente.costoUso, 4)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-2 hidden overflow-hidden rounded-xl border border-line md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-medium">Agente</th>
                  <th className="px-4 py-2.5 font-medium">Modelo</th>
                  <th className="px-4 py-2.5 font-medium">Sector</th>
                  <th className="px-4 py-2.5 font-medium text-right">Productividad</th>
                  <th className="px-4 py-2.5 font-medium text-right">Costo de uso</th>
                </tr>
              </thead>
              <tbody>
                {ai.agentes.map((agente) => (
                  <tr key={agente.id} className="border-t border-line">
                    <td className="px-4 py-2.5 font-medium">{agente.nombre}</td>
                    <td className="px-4 py-2.5 text-muted">{agente.modelo}</td>
                    <td className="px-4 py-2.5">
                      <Badge>{agente.sector}</Badge>
                    </td>
                    <td className="tabular px-4 py-2.5 text-right">
                      {(agente.productividad * 100).toFixed(0)}%
                    </td>
                    <td className="tabular px-4 py-2.5 text-right">
                      {formatearNumero(agente.costoUso, 4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <Card>
        <Titulo>Asignar agente</Titulo>
        <form onSubmit={crear} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Campo etiqueta="Nombre">
            <input
              className={inputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del agente"
            />
          </Campo>
          <Campo etiqueta="Modelo">
            <input
              className={inputClass}
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Sector">
            <input
              className={inputClass}
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Productividad (0-1)">
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              className={inputClass}
              value={productividad}
              onChange={(e) => setProductividad(Number(e.target.value))}
            />
          </Campo>
          <div className="flex items-end">
            <Button type="submit">
              <Plus size={16} /> Crear
            </Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-muted">
          El costo de uso depende del modelo y de la productividad del agente.
        </p>
      </Card>
    </div>
  );
}
