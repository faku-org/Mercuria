import { Sparkline } from "../components/Sparkline";
import { Badge, Card, Stat, Titulo, formatearMoneda } from "../components/ui";
import type { Economia } from "../types";

export function RecursosView({ economia }: { economia: Economia }) {
  const ambiente = economia.ambiente;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat
          etiqueta="Contaminación"
          valor={`${(ambiente.contaminacion * 100).toFixed(1)}%`}
          nota="sube con la producción"
        />
        <Stat etiqueta="Calidad de aire" valor={`${(ambiente.calidadAire * 100).toFixed(1)}%`} />
        <Stat
          etiqueta="Temperatura"
          valor={`+${ambiente.temperatura.toFixed(2)} °C`}
          nota="anomalía estimada"
        />
        <Stat
          etiqueta="Impacto en producción"
          valor={`−${(ambiente.impacto * 100).toFixed(1)}%`}
          nota="arrastre ambiental"
        />
      </div>

      <Card className="!p-0">
        <div className="border-b border-line px-5 py-4">
          <Titulo>Recursos básicos</Titulo>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Recurso</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Unidad</th>
                <th className="px-5 py-3 font-medium">Disponibilidad</th>
                <th className="px-5 py-3 font-medium text-right">Escasez</th>
                <th className="px-5 py-3 font-medium text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {economia.recursos.map((recurso) => (
                <tr key={recurso.id} className="border-t border-line">
                  <td className="px-5 py-3 font-medium">{recurso.nombre}</td>
                  <td className="px-5 py-3">
                    <Badge>{recurso.tipo}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted">{recurso.unidad}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{
                            width: `${Math.min(100, Math.max(0, recurso.disponibilidad * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="tabular text-xs text-muted">
                        {(recurso.disponibilidad * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="tabular px-5 py-3 text-right">
                    <span className={recurso.escasez > 0.3 ? "text-rose-600" : "text-muted"}>
                      {(recurso.escasez * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="tabular px-5 py-3 text-right">
                    {formatearMoneda(recurso.precio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          El precio sube con la escasez (×2 por unidad de escasez). La disponibilidad afecta la
          producción de todas las empresas.
        </p>
      </Card>

      <Card>
        <Titulo>Evolución ambiental</Titulo>
        {economia.historico.length < 2 ? (
          <p className="text-sm text-muted">Corré algunos períodos para ver la evolución.</p>
        ) : (
          <Sparkline
            valores={economia.historico.map((punto) => punto.contaminacion)}
            ancho={420}
            etiqueta="Contaminación por período"
          />
        )}
      </Card>
    </div>
  );
}
