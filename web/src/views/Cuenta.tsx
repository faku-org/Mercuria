import { useState } from "react";
import { Building2, LogIn, LogOut, Plus, RefreshCw, UserPlus, Waypoints } from "lucide-react";
import * as api from "../api";
import type { Empresa, Evento, Resumen, UsuarioPerfil } from "../types";
import {
  Badge,
  Button,
  Campo,
  Card,
  Stat,
  Titulo,
  formatearMoneda,
  formatearPorcentaje,
  inputClass,
} from "../components/ui";

type Accion = (fn: () => Promise<unknown>) => Promise<void>;

function variacion(inicio: number, fin: number): number {
  return inicio === 0 ? 0 : fin / inicio - 1;
}

const TONO_EVENTO: Record<string, "neutro" | "positivo" | "negativo" | "acento"> = {
  adquisicion: "acento",
  fundacion: "positivo",
  usuario: "neutro",
};

function ListaEventos({ eventos }: { eventos: Evento[] }) {
  if (eventos.length === 0) {
    return <p className="text-sm text-muted">Sin eventos en el rango.</p>;
  }
  return (
    <ul className="space-y-1.5 text-sm">
      {eventos.map((evento) => (
        <li key={evento.id} className="flex items-start gap-2">
          <Badge tono={TONO_EVENTO[evento.tipo] ?? "neutro"}>p{evento.periodo}</Badge>
          <span>{evento.descripcion}</span>
        </li>
      ))}
    </ul>
  );
}

function FormularioAuth({ onSesion }: { onSesion: (usuario: UsuarioPerfil) => void }) {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [handle, setHandle] = useState("");
  const [pin, setPin] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const sesion =
        modo === "registro"
          ? await api.registrar(handle, pin, nombre)
          : await api.login(handle, pin);
      onSesion(sesion.usuario);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <Titulo>{modo === "registro" ? "Crear cuenta" : "Iniciar sesión"}</Titulo>
      <form onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Handle">
          <input
            className={inputClass}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="tu_handle"
            autoComplete="username"
          />
        </Campo>
        {modo === "registro" ? (
          <Campo etiqueta="Nombre (opcional)">
            <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Campo>
        ) : null}
        <Campo etiqueta="PIN (4 a 8 dígitos)">
          <input
            className={inputClass}
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="current-password"
          />
        </Campo>
        {error ? <p className="text-sm text-negative">{error}</p> : null}
        <div className="flex items-center justify-between gap-2">
          <Button type="submit" disabled={cargando}>
            {modo === "registro" ? <UserPlus size={15} /> : <LogIn size={15} />}
            {modo === "registro" ? "Crear cuenta" : "Entrar"}
          </Button>
          <button
            type="button"
            className="text-sm text-accent hover:underline"
            onClick={() => setModo(modo === "registro" ? "login" : "registro")}
          >
            {modo === "registro" ? "Ya tengo cuenta" : "Crear una cuenta"}
          </button>
        </div>
      </form>
    </Card>
  );
}

export function CuentaView({
  usuario,
  resumen,
  eventos,
  empresas,
  accion,
  onSesion,
  onSalir,
  onRefrescar,
  onActualizarResumen,
}: {
  usuario: UsuarioPerfil | null;
  resumen: Resumen | null;
  eventos: Evento[];
  empresas: Empresa[];
  accion: Accion;
  onSesion: (usuario: UsuarioPerfil) => void;
  onSalir: () => void;
  onRefrescar: () => Promise<void>;
  onActualizarResumen: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState("");
  const [capital, setCapital] = useState(1_000_000);
  const [objetivo, setObjetivo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!usuario) return <FormularioAuth onSesion={onSesion} />;

  const propias = empresas.filter((empresa) => empresa.duenio === usuario.handle);
  const adquiribles = empresas.filter((empresa) => empresa.duenio !== usuario.handle);

  const fundar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setAviso(null);
    try {
      const creada = await api.fundarEmpresa(nombre, capital);
      setAviso(`Fundaste ${creada.nombre}.`);
      setNombre("");
      await onRefrescar();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const adquirir = async () => {
    setError(null);
    setAviso(null);
    await accion(async () => {
      const resultado = await api.adquirirComoUsuario(objetivo);
      setAviso(resultado.ok ? (resultado.detalle ?? "Adquisición concretada") : (resultado.motivo ?? "No se pudo"));
      if (resultado.ok) await onRefrescar();
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <Titulo
          accion={
            <Button variante="secundario" onClick={onSalir}>
              <LogOut size={15} /> Salir
            </Button>
          }
        >
          {usuario.nombre} · @{usuario.handle}
        </Titulo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat etiqueta="Empresas propias" valor={String(propias.length)} />
          <Stat etiqueta="Último período visto" valor={String(usuario.ultimoVisto)} />
          <Stat etiqueta="Miembro desde" valor={usuario.creadoEn.slice(0, 10)} />
        </div>
      </Card>

      <Card>
        <Titulo
          accion={
            <Button variante="secundario" onClick={() => void onActualizarResumen()}>
              <RefreshCw size={15} /> Actualizar
            </Button>
          }
        >
          Mientras estabas afuera
        </Titulo>
        {resumen ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Pasaron <span className="font-semibold text-ink">{resumen.periodos}</span> períodos (del{" "}
              {resumen.desde} al {resumen.hasta}).
            </p>
            <div className="grid gap-4 sm:grid-cols-4">
              <Stat
                etiqueta="PIB"
                valor={formatearMoneda(resumen.pibFin)}
                nota={formatearPorcentaje(variacion(resumen.pibInicio, resumen.pibFin))}
              />
              <Stat
                etiqueta="Productividad"
                valor={`×${resumen.productividadFin.toFixed(3)}`}
                nota={formatearPorcentaje(
                  variacion(resumen.productividadInicio, resumen.productividadFin),
                )}
              />
              <Stat
                etiqueta="Contaminación"
                valor={`${(resumen.contaminacionFin * 100).toFixed(1)}%`}
                nota={formatearPorcentaje(
                  variacion(resumen.contaminacionInicio, resumen.contaminacionFin),
                )}
              />
              <Stat
                etiqueta="Índice mercado"
                valor={resumen.indiceFin.toFixed(2)}
                nota={formatearPorcentaje(variacion(resumen.indiceInicio, resumen.indiceFin))}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Eventos</p>
              <ListaEventos eventos={resumen.eventos} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Todavía no hay un resumen disponible.</p>
        )}
      </Card>

      <Card>
        <Titulo>Mis empresas ({propias.length})</Titulo>
        {propias.length === 0 ? (
          <p className="text-sm text-muted">Todavía no tenés empresas. Fundá una abajo.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {propias.map((empresa) => (
              <li key={empresa.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <Building2 size={15} className="text-muted" />
                <span className="font-medium">{empresa.nombre}</span>
                <Badge tono="acento">{formatearMoneda(empresa.capital)}</Badge>
                <span className="text-muted">×{empresa.productividad.toFixed(2)} prod.</span>
                <span className="tabular ml-auto text-muted">
                  {formatearMoneda(empresa.capitalizacion)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={fundar} className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <Campo etiqueta="Fundar empresa">
            <input
              className={inputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Mi Empresa"
            />
          </Campo>
          <Campo etiqueta="Capital inicial">
            <input
              className={inputClass}
              type="number"
              min="0"
              step="10000"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
            />
          </Campo>
          <Button type="submit">
            <Plus size={16} /> Fundar
          </Button>
        </form>

        <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_auto] sm:items-end">
          <Campo etiqueta="Adquirir empresa del sistema">
            <select
              className={inputClass}
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
            >
              <option value="">Elegí una empresa…</option>
              {adquiribles.map((empresa) => (
                <option key={empresa.id} value={empresa.nombre}>
                  {empresa.nombre} · {formatearMoneda(empresa.capitalizacion)}
                </option>
              ))}
            </select>
          </Campo>
          <Button variante="secundario" disabled={!objetivo} onClick={() => void adquirir()}>
            <Waypoints size={15} /> Adquirir
          </Button>
        </div>

        {aviso ? (
          <p className="mt-3 rounded-xl border border-line bg-canvas px-3 py-2 text-sm">{aviso}</p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-negative">{error}</p> : null}
      </Card>

      <Card>
        <Titulo>Bitácora reciente</Titulo>
        <ListaEventos eventos={eventos.slice(-12).reverse()} />
      </Card>
    </div>
  );
}
