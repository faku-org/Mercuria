import { useEffect, useId, useRef, useState } from "react";

interface Props {
  titulo: string;
  /** Un valor por período, en orden. */
  valores: number[];
  /** Período del primer valor (para el tooltip). */
  periodoInicial: number;
  formato: (valor: number) => string;
  /** Texto corto con la lectura actual, mostrado como cifra principal. */
  actual: string;
  /** Variación respecto del primer valor visible, ya formateada, con su signo. */
  variacion?: { texto: string; tono: "positivo" | "negativo" | "neutro" };
}

const ANCHO_INICIAL = 320;
const ALTO = 96;
const MARGEN = { sup: 8, inf: 8, izq: 4, der: 4 };

const TONOS = {
  positivo: "text-positive",
  negativo: "text-negative",
  neutro: "text-muted",
} as const;

/**
 * Gráfico de línea de una sola serie con crosshair y tooltip.
 * Un eje, línea de 2 px, área tenue; el color es el acento del tema.
 */
export function GraficoSerie({
  titulo,
  valores,
  periodoInicial,
  formato,
  actual,
  variacion,
}: Props) {
  const idGradiente = useId();
  const [hover, setHover] = useState<number | null>(null);
  const contenedor = useRef<SVGSVGElement>(null);
  const hayDatos = valores.length >= 2;
  // El SVG se dibuja en píxeles reales del contenedor: así no se deforma ni crece en alto.
  const [ancho, setAncho] = useState(ANCHO_INICIAL);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;
    const observador = new ResizeObserver(([entrada]) => {
      const medido = entrada?.contentRect.width;
      if (medido && medido > 0) setAncho(Math.round(medido));
    });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [hayDatos]);

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;
  const util = { ancho: ancho - MARGEN.izq - MARGEN.der, alto: ALTO - MARGEN.sup - MARGEN.inf };
  const paso = valores.length > 1 ? util.ancho / (valores.length - 1) : 0;

  const x = (i: number) => MARGEN.izq + i * paso;
  const y = (v: number) => MARGEN.sup + util.alto - ((v - min) / rango) * util.alto;

  const linea = valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area =
    valores.length > 1
      ? `${x(0).toFixed(1)},${ALTO - MARGEN.inf} ${linea} ${x(valores.length - 1).toFixed(1)},${ALTO - MARGEN.inf}`
      : "";

  const indiceActivo = hover ?? valores.length - 1;
  const valorActivo = valores[indiceActivo];

  const alMover = (evento: React.PointerEvent<SVGSVGElement>) => {
    if (valores.length < 2) return;
    const caja = evento.currentTarget.getBoundingClientRect();
    const px = ((evento.clientX - caja.left) / caja.width) * ancho;
    const i = Math.round((px - MARGEN.izq) / paso);
    setHover(Math.min(valores.length - 1, Math.max(0, i)));
  };

  const resumen =
    valores.length > 1
      ? `${titulo}: de ${formato(valores[0]!)} a ${formato(valores[valores.length - 1]!)} entre los períodos ${periodoInicial} y ${periodoInicial + valores.length - 1}.`
      : `${titulo}: sin datos suficientes.`;

  return (
    <figure className="rounded-2xl border border-line bg-surface p-4">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{titulo}</span>
        {variacion ? (
          <span className={`tabular font-mono text-xs ${TONOS[variacion.tono]}`}>
            {variacion.texto}
          </span>
        ) : null}
      </figcaption>
      <p className="tabular mt-1 font-mono text-2xl font-medium">
        {hover === null ? actual : valorActivo === undefined ? actual : formato(valorActivo)}
      </p>
      <p className="tabular h-4 font-mono text-[11px] text-muted">
        {hover === null ? "período actual" : `período ${periodoInicial + hover}`}
      </p>

      {valores.length < 2 ? (
        <p className="mt-2 text-xs text-muted">Sin datos suficientes.</p>
      ) : (
        <svg
          ref={contenedor}
          viewBox={`0 0 ${ancho} ${ALTO}`}
          width="100%"
          height={ALTO}
          className="mt-1 block touch-pan-y"
          role="img"
          aria-label={resumen}
          onPointerMove={alMover}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill={`url(#${idGradiente})`} />
          <polyline
            points={linea}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {hover !== null && valorActivo !== undefined ? (
            <>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={MARGEN.sup}
                y2={ALTO - MARGEN.inf}
                stroke="var(--color-line)"
                strokeWidth="1"
              />
              <circle
                cx={x(hover)}
                cy={y(valorActivo)}
                r="4"
                fill="var(--color-accent)"
                stroke="var(--color-surface)"
                strokeWidth="2"
              />
            </>
          ) : (
            <circle
              cx={x(valores.length - 1)}
              cy={y(valores[valores.length - 1]!)}
              r="3.5"
              fill="var(--color-accent)"
              stroke="var(--color-surface)"
              strokeWidth="2"
            />
          )}
        </svg>
      )}
    </figure>
  );
}
