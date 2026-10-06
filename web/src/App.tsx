import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Briefcase,
  Building2,
  Globe,
  Loader2,
  RefreshCw,
  RotateCcw,
  Scale,
  Wallet,
} from "lucide-react";
import * as api from "./api";
import type { Mundo } from "./types";
import { Button } from "./components/ui";
import { AIView } from "./views/AI";
import { EmpresasView } from "./views/Empresas";
import { LeyesView } from "./views/Leyes";
import { NacionesView } from "./views/Naciones";
import { NominaView } from "./views/Nomina";
import { PropiedadesView } from "./views/Propiedades";

const PESTANAS = [
  {
    id: "nomina",
    label: "Nómina",
    Icono: Wallet,
    titulo: "Nómina",
    desc: "Cálculo polimórfico de sueldos con leyes aplicadas.",
  },
  {
    id: "naciones",
    label: "Naciones",
    Icono: Globe,
    titulo: "Naciones y estados",
    desc: "Territorios, población y leyes propias.",
  },
  {
    id: "leyes",
    label: "Leyes",
    Icono: Scale,
    titulo: "Leyes",
    desc: "Efecto, magnitud y alcance sobre cada módulo.",
  },
  {
    id: "propiedades",
    label: "Propiedades",
    Icono: Building2,
    titulo: "Propiedades",
    desc: "Compra, venta y precio afectado por leyes.",
  },
  {
    id: "empresas",
    label: "Empresas",
    Icono: Briefcase,
    titulo: "Empresas",
    desc: "Capital, jerarquía, propiedades e IA.",
  },
  {
    id: "ai",
    label: "IA y agentes",
    Icono: Bot,
    titulo: "IA y agentes",
    desc: "Entidad total con agentes por sector y costo de uso.",
  },
] as const;

type PestanaId = (typeof PESTANAS)[number]["id"];

export default function App() {
  const [mundo, setMundo] = useState<Mundo | null>(null);
  const [pestana, setPestana] = useState<PestanaId>("nomina");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      setMundo(await api.getMundo());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const accion = useCallback(
    async (fn: () => Promise<unknown>) => {
      try {
        await fn();
        await recargar();
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [recargar],
  );

  const actual = PESTANAS.find((item) => item.id === pestana) ?? PESTANAS[0];

  return (
    <div className="mx-auto flex min-h-full max-w-6xl gap-8 px-6 py-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="mb-6">
          <p className="text-sm font-semibold">Polimorfismo</p>
          <p className="text-xs text-muted">Panel de dominio</p>
        </div>
        <nav className="space-y-1">
          {PESTANAS.map(({ id, label, Icono }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPestana(id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                pestana === id ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface"
              }`}
            >
              <Icono size={17} /> {label}
            </button>
          ))}
        </nav>
        <div className="mt-6 border-t border-line pt-4">
          <Button variante="secundario" onClick={() => void accion(() => api.reiniciar())}>
            <RotateCcw size={15} /> Reiniciar datos
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{actual.titulo}</h1>
            <p className="mt-0.5 text-sm text-muted">{actual.desc}</p>
          </div>
          <Button variante="secundario" onClick={() => void recargar()} disabled={cargando}>
            {cargando ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Actualizar
          </Button>
        </header>

        <div className="mb-4 flex gap-1 overflow-x-auto lg:hidden">
          {PESTANAS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPestana(id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
                pestana === id ? "bg-accent-soft text-accent" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {mundo === null ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : (
          <>
            {pestana === "nomina" ? <NominaView nomina={mundo.nomina} accion={accion} /> : null}
            {pestana === "naciones" ? (
              <NacionesView naciones={mundo.naciones} estados={mundo.estados} />
            ) : null}
            {pestana === "leyes" ? (
              <LeyesView leyes={mundo.leyes} resumen={mundo.resumenLeyes} accion={accion} />
            ) : null}
            {pestana === "propiedades" ? (
              <PropiedadesView propiedades={mundo.propiedades} accion={accion} />
            ) : null}
            {pestana === "empresas" ? <EmpresasView empresas={mundo.empresas} /> : null}
            {pestana === "ai" ? <AIView ais={mundo.ais} accion={accion} /> : null}
          </>
        )}
      </main>
    </div>
  );
}
