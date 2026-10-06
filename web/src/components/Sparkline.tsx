import type { ReactNode } from "react";

/** Gráfico de línea mínimo en SVG, sin dependencias. */
export function Sparkline({
  valores,
  ancho = 240,
  alto = 44,
  etiqueta,
}: {
  valores: number[];
  ancho?: number;
  alto?: number;
  etiqueta?: ReactNode;
}) {
  if (valores.length < 2) {
    return <p className="text-xs text-muted">Sin datos suficientes.</p>;
  }

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;
  const paso = ancho / (valores.length - 1);

  const puntos = valores
    .map((valor, indice) => {
      const x = indice * paso;
      const y = alto - ((valor - min) / rango) * (alto - 6) - 3;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const ultimoX = (valores.length - 1) * paso;
  const ultimoY = alto - ((valores[valores.length - 1]! - min) / rango) * (alto - 6) - 3;

  return (
    <div>
      {etiqueta ? <div className="mb-1 text-xs text-muted">{etiqueta}</div> : null}
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: alto }}
        role="img"
      >
        <polyline
          points={puntos}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={ultimoX} cy={ultimoY} r="2.5" fill="var(--color-accent)" />
      </svg>
    </div>
  );
}
