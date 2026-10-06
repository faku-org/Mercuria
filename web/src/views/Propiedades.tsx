import { Building2, MapPin, ShoppingCart, User } from "lucide-react";
import * as api from "../api";
import type { Propiedad } from "../types";
import { Badge, Button, Card, formatearMoneda, Titulo } from "../components/ui";

type Accion = (fn: () => Promise<unknown>) => Promise<void>;

export function PropiedadesView({
  propiedades,
  accion,
}: {
  propiedades: Propiedad[];
  accion: Accion;
}) {
  return (
    <Card>
      <Titulo>Propiedades</Titulo>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {propiedades.map((propiedad) => {
          const ajustado = propiedad.precioConLeyes !== propiedad.precio;
          return (
            <div key={propiedad.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{propiedad.nombre}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <MapPin size={13} />
                    {propiedad.estado ? `${propiedad.estado}, ` : ""}
                    {propiedad.nacion}
                  </p>
                </div>
                <Badge tono={propiedad.duenio ? "acento" : "neutro"}>
                  {propiedad.duenio ? "ocupada" : "libre"}
                </Badge>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="tabular text-xl font-semibold">
                    {formatearMoneda(propiedad.precioConLeyes)}
                  </p>
                  {ajustado ? (
                    <p className="tabular text-xs text-muted line-through">
                      {formatearMoneda(propiedad.precio)}
                    </p>
                  ) : null}
                </div>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <User size={13} />
                  {propiedad.duenio ?? "sin dueño"}
                </p>
              </div>

              <p className="mt-2 font-mono text-[11px] text-muted">{propiedad.id}</p>

              {!propiedad.duenio ? (
                <Button
                  variante="secundario"
                  onClick={() => void accion(() => api.comprarPropiedad(propiedad.id))}
                >
                  <ShoppingCart size={15} /> Comprar
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
        <Building2 size={14} /> El precio final aplica las leyes de la nación/estado donde está la
        propiedad; la compra descuenta el capital de la empresa.
      </p>
    </Card>
  );
}
