import { Scale, Power } from "lucide-react";
import * as api from "../api";
import type { Ley, ResumenLeyes } from "../types";
import { Badge, Button, Card, Stat, formatearPorcentaje, Titulo } from "../components/ui";

type Accion = (fn: () => Promise<unknown>) => Promise<void>;

const OBJETIVOS: Record<string, string> = {
  sueldo: "Sueldos",
  empresa: "Empresas",
  propiedad: "Propiedades",
  ai: "IA",
};

export function LeyesView({
  leyes,
  resumen,
  accion,
}: {
  leyes: Ley[];
  resumen: ResumenLeyes;
  accion: Accion;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-5">
        <Stat
          etiqueta="Leyes"
          valor={`${resumen.activas}/${resumen.total}`}
          nota="activas / total"
        />
        {(["sueldo", "empresa", "propiedad", "ai"] as const).map((objetivo) => (
          <Stat
            key={objetivo}
            etiqueta={OBJETIVOS[objetivo] ?? objetivo}
            valor={formatearPorcentaje(resumen.factores[objetivo] ?? 0)}
          />
        ))}
      </div>

      <Card className="!p-0">
        <div className="border-b border-line px-5 py-4">
          <Titulo>Leyes vigentes</Titulo>
        </div>
        <ul className="divide-y divide-line">
          {leyes.map((ley) => (
            <li key={ley.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{ley.nombre}</p>
                  <Badge tono="acento">{OBJETIVOS[ley.objetivo] ?? ley.objetivo}</Badge>
                  <Badge tono={ley.efecto === "positivo" ? "positivo" : "negativo"}>
                    {ley.efecto === "positivo" ? "+" : "−"}
                    {(ley.magnitud * 100).toFixed(0)}%
                  </Badge>
                  <Badge>{ley.alcance}</Badge>
                  {ley.limite !== null ? <Badge>cupo {ley.limite}</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted">{ley.descripcion}</p>
                <p className="mt-1 font-mono text-xs text-muted">{ley.id}</p>
              </div>
              <Button
                variante={ley.activa ? "secundario" : "primario"}
                onClick={() => void accion(() => api.toggleLey(ley.id))}
              >
                <Power size={16} /> {ley.activa ? "Desactivar" : "Activar"}
              </Button>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-1.5 border-t border-line px-5 py-3 text-xs text-muted">
          <Scale size={14} /> Al cambiar una ley se recalculan sueldos, precios de propiedades y el
          costo de la IA.
        </p>
      </Card>
    </div>
  );
}
