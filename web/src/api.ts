import type { Mundo } from "./types";

const BASE = "/api";

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => null)) as { error?: string } | null;
    throw new Error(cuerpo?.error ?? respuesta.statusText);
  }
  return (await respuesta.json()) as T;
}

export const getMundo = () => pedir<Mundo>("/mundo");

export const toggleLey = (id: string) =>
  pedir<{ ok: boolean; id: string; activa: boolean }>(`/leyes/${id}/toggle`, { method: "POST" });

export const comprarPropiedad = (id: string) =>
  pedir<{ ok: boolean; motivo?: string }>(`/propiedades/${id}/comprar`, { method: "POST" });

export const crearEmpleado = (datos: Record<string, unknown>) =>
  pedir<{ ok: boolean; empleado: string }>("/empleados", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const crearAgente = (datos: Record<string, unknown>) =>
  pedir<{ ok: boolean; agente: string }>("/agentes", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const reiniciar = () => pedir<{ ok: boolean }>("/reiniciar", { method: "POST" });
