import { useState } from "react";
import { Bot, Building2, TrendingDown, TrendingUp } from "lucide-react";
import * as api from "../api";
import {
  Badge,
  Button,
  Card,
  Stat,
  Titulo,
  formatearMoneda,
  formatearNumero,
} from "../components/ui";
import type { Empresa, Mercado } from "../types";

type Accion = (fn: () => Promise<unknown>) => Promise<void>;

export function MercadoView({
  mercado,
  empresas,
  accion,
}: {
  mercado: Mercado;
  empresas: Empresa[];
  accion: Accion;
}) {
  const [aviso, setAviso] = useState<string | null>(null);

  const total = mercado.cotizaciones.reduce(
    (suma, cotizacion) => suma + cotizacion.capitalizacion,
    0,
  );

  const adquirir = async (objetivo: string, porIA: boolean) => {
    setAviso(null);
    await accion(async () => {
      const resultado = await api.adquirirEmpresa(objetivo, porIA);
      setAviso(
        resultado.ok
          ? (resultado.detalle ?? "Adquisición concretada")
          : (resultado.motivo ?? "No se pudo adquirir"),
      );
    });
  };

  const controlDe = (nombre: string) => empresas.find((e) => e.nombre === nombre);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          etiqueta="Índice de mercado"
          valor={formatearNumero(mercado.indice, 2)}
          nota="base 100"
        />
        <Stat etiqueta="Empresas cotizando" valor={String(mercado.cotizaciones.length)} />
        <Stat etiqueta="Capitalización total" valor={formatearMoneda(total)} />
      </div>

      <Card className="!p-0">
        <div className="border-b border-line px-5 py-4">
          <Titulo>Mercado</Titulo>
        </div>

        {/* Móvil: tarjetas con los botones de adquisición alcanzables. */}
        <ul className="divide-y divide-line md:hidden">
          {mercado.cotizaciones.map((cotizacion) => {
            const empresa = controlDe(cotizacion.empresa);
            const alza = cotizacion.variacion >= 0;
            return (
              <li key={cotizacion.empresa} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{cotizacion.empresa}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {empresa?.controladaPor
                        ? `controla ${empresa.controladaPor}`
                        : "independiente"}{" "}
                      · {cotizacion.cantidad.toLocaleString("es-AR")} acciones
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular font-semibold">{formatearMoneda(cotizacion.precio)}</p>
                    <p className={`tabular text-xs ${alza ? "text-positive" : "text-negative"}`}>
                      {alza ? "+" : ""}
                      {formatearNumero(cotizacion.variacion * 100, 2)}%
                    </p>
                  </div>
                </div>
                <p className="tabular mt-1 text-xs text-muted">
                  capitalización {formatearMoneda(cotizacion.capitalizacion)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variante="secundario"
                    disabled={Boolean(empresa?.esControlada)}
                    onClick={() => void adquirir(cotizacion.empresa, false)}
                  >
                    <Building2 size={14} /> Empresa
                  </Button>
                  <Button
                    disabled={Boolean(empresa?.esControlada)}
                    onClick={() => void adquirir(cotizacion.empresa, true)}
                  >
                    <Bot size={14} /> Orion
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Empresa</th>
                <th className="px-5 py-3 font-medium text-right">Precio</th>
                <th className="px-5 py-3 font-medium text-right">Variación</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
                <th className="px-5 py-3 font-medium text-right">Capitalización</th>
                <th className="px-5 py-3 font-medium">Control</th>
                <th className="px-5 py-3 font-medium text-right">Adquirir</th>
              </tr>
            </thead>
            <tbody>
              {mercado.cotizaciones.map((cotizacion) => {
                const empresa = controlDe(cotizacion.empresa);
                const alza = cotizacion.variacion >= 0;
                return (
                  <tr key={cotizacion.empresa} className="border-t border-line">
                    <td className="px-5 py-3 font-medium">{cotizacion.empresa}</td>
                    <td className="tabular px-5 py-3 text-right">
                      {formatearMoneda(cotizacion.precio)}
                    </td>
                    <td className="tabular px-5 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 ${alza ? "text-positive" : "text-negative"}`}
                      >
                        {alza ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {formatearNumero(cotizacion.variacion * 100, 2)}%
                      </span>
                    </td>
                    <td className="tabular px-5 py-3 text-right text-muted">
                      {cotizacion.cantidad.toLocaleString("es-AR")}
                    </td>
                    <td className="tabular px-5 py-3 text-right font-semibold">
                      {formatearMoneda(cotizacion.capitalizacion)}
                    </td>
                    <td className="px-5 py-3">
                      {empresa?.controladaPor ? (
                        <Badge tono="acento">{empresa.controladaPor}</Badge>
                      ) : (
                        <span className="text-muted">independiente</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variante="secundario"
                          disabled={Boolean(empresa?.esControlada)}
                          onClick={() => void adquirir(cotizacion.empresa, false)}
                        >
                          <Building2 size={14} /> Empresa Demo
                        </Button>
                        <Button
                          disabled={Boolean(empresa?.esControlada)}
                          onClick={() => void adquirir(cotizacion.empresa, true)}
                        >
                          <Bot size={14} /> Orion (IA)
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          El costo de adquisición es la capitalización más una prima del 20%. La IA paga con el
          capital de su empresa matriz.
        </p>
      </Card>

      {aviso ? (
        <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">{aviso}</div>
      ) : null}
    </div>
  );
}
