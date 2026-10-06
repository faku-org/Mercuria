import type { ReactNode } from "react";

export function formatearMoneda(monto: number): string {
  return `$ ${monto.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

export function formatearNumero(valor: number, decimales = 2): string {
  return valor.toLocaleString("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function formatearNivel(fraccion: number, decimales = 1): string {
  return `${formatearNumero(fraccion * 100, decimales)}%`;
}

export function formatearPorcentaje(factor: number, decimales = 1): string {
  const signo = factor > 0 ? "+" : "";
  return `${signo}${formatearNumero(factor * 100, decimales)}%`;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>{children}</div>
  );
}

export function Stat({
  etiqueta,
  valor,
  nota,
}: {
  etiqueta: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{etiqueta}</p>
      <p className="tabular mt-1 text-2xl font-semibold">{valor}</p>
      {nota ? <p className="mt-0.5 text-xs text-muted">{nota}</p> : null}
    </div>
  );
}

type Tono = "neutro" | "positivo" | "negativo" | "acento";

const TONOS: Record<Tono, string> = {
  neutro: "bg-canvas text-muted",
  positivo: "bg-positive-soft text-positive",
  negativo: "bg-negative-soft text-negative",
  acento: "bg-accent-soft text-accent",
};

export function Badge({ children, tono = "neutro" }: { children: ReactNode; tono?: Tono }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variante = "primario",
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed";
  const estilos =
    variante === "primario"
      ? "bg-accent text-on-accent hover:opacity-90"
      : "border border-line bg-surface text-ink hover:bg-canvas";
  return (
    <button
      type={type}
      className={`${base} ${estilos} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

export function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{etiqueta}</span>
      {children}
    </label>
  );
}

export function Titulo({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <h2 className="text-lg font-semibold">{children}</h2>
      {accion ? <div className="flex flex-wrap items-center gap-2">{accion}</div> : null}
    </div>
  );
}
