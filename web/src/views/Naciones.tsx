import { Globe, MapPin, Users } from "lucide-react";
import type { Estado, Nacion } from "../types";
import { Badge, Card, Titulo } from "../components/ui";

export function NacionesView({ naciones, estados }: { naciones: Nacion[]; estados: Estado[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {naciones.map((nacion) => {
        const suyos = estados.filter((estado) => estado.nacion === nacion.nombre);
        return (
          <Card key={nacion.id}>
            <Titulo accion={<Badge tono="acento">{nacion.iniciales}</Badge>}>
              {nacion.nombre}
            </Titulo>

            <div className="space-y-1.5 text-sm text-muted">
              <p className="flex items-center gap-2">
                <MapPin size={14} /> Capital: {nacion.capital}
              </p>
              <p className="flex items-center gap-2">
                <Globe size={14} /> Idioma: {nacion.idioma}
              </p>
              <p className="flex items-center gap-2">
                <Users size={14} /> Población: {nacion.poblacion.toLocaleString("es-AR")}
              </p>
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
              Leyes ({nacion.leyes.length})
            </p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {nacion.leyes.map((ley) => (
                <li key={ley.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">{ley.nombre}</span>
                  <Badge tono={ley.activa ? "positivo" : "neutro"}>
                    {ley.activa ? "activa" : "inactiva"}
                  </Badge>
                </li>
              ))}
            </ul>

            {suyos.length > 0 ? (
              <>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
                  Estados ({suyos.length})
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {suyos.map((estado) => (
                    <li key={estado.id} className="flex items-center justify-between gap-3">
                      <span>{estado.nombre}</span>
                      <span className="text-muted">{estado.leyes.length} leyes propias</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
