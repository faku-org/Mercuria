import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import * as api from "../api";
import type { Nomina } from "../types";
import {
  Badge,
  Button,
  Campo,
  Card,
  Stat,
  formatearMoneda,
  formatearNumero,
  formatearPorcentaje,
  inputClass,
  Titulo,
} from "../components/ui";

type Accion = (fn: () => Promise<unknown>) => Promise<void>;

export function NominaView({ nomina, accion }: { nomina: Nomina; accion: Accion }) {
  const [tipo, setTipo] = useState("fijo");
  const [nombre, setNombre] = useState("");
  const [horas, setHoras] = useState(160);
  const [tarifa, setTarifa] = useState(2500);
  const [base, setBase] = useState(30000);
  const [ventas, setVentas] = useState(500000);
  const [comision, setComision] = useState(5);

  const agregar = (evento: React.FormEvent) => {
    evento.preventDefault();
    let datos: Record<string, unknown> = { tipo, nombre };
    if (tipo === "porHora") datos = { ...datos, horasTrabajadas: horas, tarifaPorHora: tarifa };
    if (tipo === "vendedor")
      datos = { ...datos, sueldoBase: base, ventas, porcentajeComision: comision };
    void accion(() => api.crearEmpleado(datos));
    setNombre("");
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat etiqueta="Total base" valor={formatearMoneda(nomina.totalBase)} />
        <Stat
          etiqueta="Total con leyes"
          valor={formatearMoneda(nomina.totalFinal)}
          nota={
            nomina.totalBase > 0
              ? formatearPorcentaje(nomina.totalFinal / nomina.totalBase - 1)
              : undefined
          }
        />
        <Stat etiqueta="Empleados" valor={String(nomina.lineas.length)} />
      </div>

      <Card className="!p-0">
        <div className="border-b border-line px-5 py-4">
          <Titulo>Nómina</Titulo>
        </div>

        {/* Móvil: tarjetas. La tabla de 7 columnas no entra en 390px. */}
        <ul className="divide-y divide-line md:hidden">
          {nomina.lineas.map((linea) => (
            <li key={linea.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    <span className="tabular text-muted">#{linea.id} </span>
                    {linea.nombre}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {linea.tipo.replace("Empleado", "")} · {linea.tipoSueldo}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tabular font-semibold">{formatearMoneda(linea.sueldoFinal)}</p>
                  <p className="tabular text-xs text-muted">
                    base {formatearMoneda(linea.sueldoBase)}
                  </p>
                </div>
              </div>
              {linea.factorLeyes !== 0 || linea.factorProductividad !== 1 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {linea.factorLeyes !== 0 ? (
                    <Badge tono={linea.factorLeyes > 0 ? "positivo" : "negativo"}>
                      leyes {formatearPorcentaje(linea.factorLeyes)}
                    </Badge>
                  ) : null}
                  {linea.factorProductividad !== 1 ? (
                    <Badge>prod. ×{formatearNumero(linea.factorProductividad, 3)}</Badge>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Sueldo</th>
                <th className="px-5 py-3 font-medium">Base</th>
                <th className="px-5 py-3 font-medium">Leyes</th>
                <th className="px-5 py-3 font-medium text-right">Final</th>
              </tr>
            </thead>
            <tbody>
              {nomina.lineas.map((linea) => (
                <tr key={linea.id} className="border-t border-line">
                  <td className="tabular px-5 py-3 text-muted">{linea.id}</td>
                  <td className="px-5 py-3 font-medium">{linea.nombre}</td>
                  <td className="px-5 py-3">
                    <Badge tono="acento">{linea.tipo.replace("Empleado", "")}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted">{linea.tipoSueldo}</td>
                  <td className="tabular px-5 py-3">{formatearMoneda(linea.sueldoBase)}</td>
                  <td className="tabular px-5 py-3">
                    {linea.factorLeyes === 0 ? (
                      <span className="text-muted">-</span>
                    ) : (
                      <span
                        className={linea.factorLeyes > 0 ? "text-positive" : "text-negative"}
                      >
                        {formatearPorcentaje(linea.factorLeyes)}
                      </span>
                    )}
                  </td>
                  <td className="tabular px-5 py-3 text-right font-semibold">
                    {formatearMoneda(linea.sueldoFinal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <Titulo>Crear empleado</Titulo>
        <form onSubmit={agregar} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Tipo">
            <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="fijo">Fijo</option>
              <option value="porHora">Por hora</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </Campo>
          <Campo etiqueta="Nombre">
            <input
              className={inputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
            />
          </Campo>

          {tipo === "porHora" ? (
            <>
              <Campo etiqueta="Horas trabajadas">
                <input
                  type="number"
                  className={inputClass}
                  value={horas}
                  onChange={(e) => setHoras(Number(e.target.value))}
                />
              </Campo>
              <Campo etiqueta="Tarifa por hora">
                <input
                  type="number"
                  className={inputClass}
                  value={tarifa}
                  onChange={(e) => setTarifa(Number(e.target.value))}
                />
              </Campo>
            </>
          ) : null}

          {tipo === "vendedor" ? (
            <>
              <Campo etiqueta="Sueldo base">
                <input
                  type="number"
                  className={inputClass}
                  value={base}
                  onChange={(e) => setBase(Number(e.target.value))}
                />
              </Campo>
              <Campo etiqueta="Ventas">
                <input
                  type="number"
                  className={inputClass}
                  value={ventas}
                  onChange={(e) => setVentas(Number(e.target.value))}
                />
              </Campo>
              <Campo etiqueta="Comisión (%)">
                <input
                  type="number"
                  className={inputClass}
                  value={comision}
                  onChange={(e) => setComision(Number(e.target.value))}
                />
              </Campo>
            </>
          ) : null}

          <div className="flex items-end">
            <Button type="submit">
              <Plus size={16} /> Agregar
            </Button>
          </div>
        </form>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <Wallet size={14} /> Los sueldos incluyen las leyes vigentes en la ubicación de la
          empresa.
        </p>
      </Card>
    </div>
  );
}
