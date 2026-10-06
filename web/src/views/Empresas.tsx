import { Bot, Crown, MapPin, Users } from "lucide-react";
import type { Empresa } from "../types";
import { Badge, Card, formatearMoneda, Titulo } from "../components/ui";

export function EmpresasView({ empresas }: { empresas: Empresa[] }) {
  return (
    <div className="space-y-4">
      {empresas.map((empresa) => (
        <Card key={empresa.id}>
          <Titulo
            accion={
              <div className="flex flex-wrap items-center gap-2">
                <Badge>×{empresa.productividad.toFixed(2)} prod.</Badge>
                {empresa.controladaPor ? (
                  <Badge tono="acento">{empresa.controladaPor}</Badge>
                ) : null}
                <Badge tono="acento">{formatearMoneda(empresa.capital)}</Badge>
              </div>
            }
          >
            {empresa.nombre}
          </Titulo>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line p-3 text-sm">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <MapPin size={13} /> Ubicación
              </p>
              <p className="mt-1">
                {empresa.estado ? `${empresa.estado}, ` : ""}
                {empresa.nacion ?? "sin definir"}
              </p>
            </div>
            <div className="rounded-xl border border-line p-3 text-sm">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Crown size={13} /> Jefe
              </p>
              <p className="mt-1">{empresa.jefe ?? "sin jefe"}</p>
            </div>
            <div className="rounded-xl border border-line p-3 text-sm">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Bot size={13} /> IA
              </p>
              <p className="mt-1">{empresa.ai ?? "sin IA"}</p>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            <Users size={13} /> Plantilla ({empresa.empleados.length}) · base{" "}
            {formatearMoneda(empresa.nominaTotal)}
          </p>
          <ul className="mt-2 divide-y divide-line text-sm">
            {empresa.empleados.map((empleado) => (
              <li key={empleado.id} className="flex items-center justify-between gap-3 py-2">
                <span className="font-medium">
                  {empleado.nombre}
                  {empleado.nombre === empresa.jefe ? <Badge tono="acento">jefe</Badge> : null}
                </span>
                <span className="tabular text-muted">
                  {formatearMoneda(empleado.sueldoBase)} base →{" "}
                  <span className="text-ink">{formatearMoneda(empleado.sueldoFinal)}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
            Propiedades ({empresa.propiedades.length})
          </p>
          {empresa.propiedades.length === 0 ? (
            <p className="mt-1 text-sm text-muted">Sin propiedades en cartera.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {empresa.propiedades.map((propiedad) => (
                <li key={propiedad.id} className="flex items-center justify-between gap-3">
                  <span>{propiedad.nombre}</span>
                  <span className="tabular text-muted">
                    {formatearMoneda(propiedad.precioConLeyes)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-line p-3">
              <p className="text-xs text-muted">Cotización</p>
              <p className="tabular mt-1">
                {empresa.precioAccion === null
                  ? "no cotiza"
                  : formatearMoneda(empresa.precioAccion)}
              </p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="text-xs text-muted">Capitalización</p>
              <p className="tabular mt-1">{formatearMoneda(empresa.capitalizacion)}</p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="text-xs text-muted">Valor contable</p>
              <p className="tabular mt-1">{formatearMoneda(empresa.valorContable)}</p>
            </div>
          </div>

          {empresa.subsidiarias.length > 0 ? (
            <p className="mt-3 text-xs text-muted">
              Subsidiarias: {empresa.subsidiarias.join(", ")}
            </p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
