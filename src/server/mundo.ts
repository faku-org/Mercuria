// Estado mutable del "mundo" de ejemplo y mapeo a DTOs JSON.
// El servidor mantiene un único mundo en memoria construido desde los fixtures.

import type AI from "../domain/AI";
import Agente from "../domain/Agente";
import type Empleado from "../domain/Empleado";
import EmpleadoFijo from "../domain/EmpleadoFijo";
import EmpleadoPorHora from "../domain/EmpleadoPorHora";
import type Empresa from "../domain/Empresa";
import type Estado from "../domain/Estado";
import Jefe from "../domain/Jefe";
import type Ley from "../domain/Ley";
import type Nacion from "../domain/Nacion";
import type Propiedad from "../domain/Propiedad";
import Vendedor from "../domain/Vendedor";
import agentesDemo, { aiCentral } from "../fixtures/aiBase";
import empleadosBase, { empresaDemo } from "../fixtures/empleadosBase";
import estadosBase from "../fixtures/estadosBase";
import leyesBase, { leyesGlobales } from "../fixtures/leyesBase";
import nacionesBase from "../fixtures/nacionesBase";
import propiedadesBase from "../fixtures/propiedadesBase";
import { resumenLeyes } from "../services/leyes";
import { calcularNomina, totalNomina, totalNominaFinal } from "../services/nomina";

/** Nómina viva (mutable): los empleados que existen hoy en el mundo. */
const mundoEmpleados: Empleado[] = [...empleadosBase];
let proximoIdEmpleado = mundoEmpleados.reduce((maximo, e) => Math.max(maximo, e.id), 0) + 1;

// --- DTOs -------------------------------------------------------------------

function leyDto(ley: Ley) {
  return {
    id: ley.id,
    nombre: ley.nombre,
    descripcion: ley.descripcion,
    objetivo: ley.objetivo,
    efecto: ley.efecto,
    magnitud: ley.magnitud,
    alcance: ley.alcance,
    activa: ley.activa,
    limite: ley.limite ?? null,
    afecta: ley.afecta.map((nacion) => nacion.nombre),
  };
}

function nacionDto(nacion: Nacion) {
  return {
    nombre: nacion.nombre,
    id: nacion.id,
    iniciales: nacion.iniciales,
    capital: nacion.capital,
    idioma: nacion.idioma,
    poblacion: nacion.poblacion,
    leyes: nacion.leyes.map(leyDto),
  };
}

function estadoDto(estado: Estado) {
  return {
    ...nacionDto(estado),
    nacion: estado.nacion.nombre,
    // Las leyes del estado ya vienen tipadas como LeyEstatal[].
    leyes: estado.leyes.map(leyDto),
  };
}

function empleadoDto(empleado: Empleado) {
  const base = empleado.calcularSueldo();
  const final = empleado.sueldoConLeyes(leyesGlobales);
  return {
    id: empleado.id,
    nombre: empleado.nombre,
    tipo: empleado.constructor.name,
    tipoSueldo: empleado.tipoSueldo(),
    sueldoBase: base,
    factorLeyes: base === 0 ? 0 : Number((final.monto / base - 1).toFixed(6)),
    sueldoFinal: final.monto,
    empresa: empleado.empresa.nombre,
  };
}

function propiedadDto(propiedad: Propiedad) {
  return {
    id: propiedad.id,
    nombre: propiedad.nombre,
    precio: propiedad.precio,
    precioConLeyes: propiedad.precioConLeyes(leyesGlobales),
    nacion: propiedad.nacion.nombre,
    estado: propiedad.estado?.nombre ?? null,
    dueño: propiedad.dueño?.nombre ?? null,
  };
}

function empresaDto(empresa: Empresa) {
  return {
    nombre: empresa.nombre,
    id: empresa.id,
    capital: empresa.capital,
    nacion: empresa.nacion?.nombre ?? null,
    estado: empresa.estado?.nombre ?? null,
    jefe: empresa.jefe?.nombre ?? null,
    empleados: empresa.empleados.map(empleadoDto),
    propiedades: empresa.propiedades.map(propiedadDto),
    ai: empresa.ai?.nombre ?? null,
    nominaTotal: empresa.nominaTotal(),
  };
}

function agenteDto(agente: Agente) {
  return {
    id: agente.id,
    nombre: agente.nombre,
    modelo: agente.modelo,
    sector: agente.sector,
    productividad: agente.productividad,
    costoUso: agente.costoUso(),
  };
}

function aiDto(ai: AI) {
  return {
    id: ai.id,
    nombre: ai.nombre,
    modelo: ai.modelo,
    empresaMatriz: ai.empresaMatriz.nombre,
    asi: ai.asi,
    rogue: ai.rogue,
    sueldoBase: ai.sueldoBase,
    sueldoFinal: ai.sueldoConLeyes(leyesGlobales).monto,
    agentes: ai.agentes.map(agenteDto),
  };
}

function nominaDto() {
  return {
    lineas: calcularNomina(mundoEmpleados, leyesGlobales),
    totalBase: totalNomina(mundoEmpleados),
    totalFinal: totalNominaFinal(mundoEmpleados, leyesGlobales),
  };
}

/** Estado completo del mundo, listo para serializar. */
function mundoDto() {
  return {
    generado: new Date().toISOString(),
    naciones: nacionesBase.map(nacionDto),
    estados: estadosBase.map(estadoDto),
    leyes: leyesBase.map(leyDto),
    resumenLeyes: resumenLeyes(leyesBase),
    empresas: [empresaDto(empresaDemo)],
    empleados: mundoEmpleados.map(empleadoDto),
    nomina: nominaDto(),
    propiedades: propiedadesBase.map(propiedadDto),
    ais: [aiDto(aiCentral)],
  };
}

// --- Acciones ---------------------------------------------------------------

interface NuevoEmpleado {
  tipo?: string;
  nombre?: string;
  horasTrabajadas?: number;
  tarifaPorHora?: number;
  sueldoBase?: number;
  ventas?: number;
  porcentajeComision?: number;
  sueldo?: number;
}

function crearEmpleado(datos: NuevoEmpleado): Empleado {
  const nombre = (datos.nombre ?? "").trim() || `Empleado ${proximoIdEmpleado}`;
  const id = proximoIdEmpleado++;
  let empleado: Empleado;
  switch (datos.tipo) {
    case "porHora":
      empleado = new EmpleadoPorHora(
        nombre,
        id,
        empresaDemo,
        Number(datos.horasTrabajadas ?? 0),
        Number(datos.tarifaPorHora ?? 0),
      );
      break;
    case "vendedor":
      empleado = new Vendedor(
        nombre,
        id,
        empresaDemo,
        Number(datos.sueldoBase ?? 0),
        Number(datos.ventas ?? 0),
        Number(datos.porcentajeComision ?? 0),
      );
      break;
    case "jefe":
      empleado = new Jefe(Number(datos.sueldo ?? 0), nombre, id, empresaDemo, "General");
      break;
    default:
      empleado = new EmpleadoFijo(nombre, id, empresaDemo);
  }
  empresaDemo.contratar(empleado);
  mundoEmpleados.push(empleado);
  return empleado;
}

function toggleLey(id: string): Ley | undefined {
  const ley = leyesBase.find((candidata) => candidata.id === id);
  if (!ley) return undefined;
  ley.activa = !ley.activa;
  return ley;
}

function comprarPropiedad(id: string): { ok: boolean; motivo?: string } {
  const propiedad = propiedadesBase.find((candidata) => candidata.id === id);
  if (!propiedad) return { ok: false, motivo: "Propiedad inexistente" };
  const comprada = empresaDemo.comprarPropiedad(propiedad);
  return comprada ? { ok: true } : { ok: false, motivo: "Capital insuficiente" };
}

interface NuevoAgente {
  nombre?: string;
  modelo?: string;
  sector?: string;
  productividad?: number;
}

function crearAgente(datos: NuevoAgente): Agente {
  const nombre = (datos.nombre ?? "").trim() || "Agente";
  const modelo = (datos.modelo ?? "Claude 3.5").trim();
  const sector = (datos.sector ?? "general").trim() || "general";
  const productividad = Math.min(Math.max(Number(datos.productividad ?? 0.8), 0), 1);
  const agente = new Agente(nombre, modelo, aiCentral, sector, productividad);
  agentesDemo.push(agente);
  return agente;
}

// --- Reset ------------------------------------------------------------------

const estadoInicial = {
  leyesActivas: new Map(leyesBase.map((ley) => [ley.id, ley.activa])),
  capital: empresaDemo.capital,
  empleados: [...empleadosBase],
  dueños: new Map(propiedadesBase.map((propiedad) => [propiedad.id, propiedad.dueño])),
  propiedadesEmpresa: [...empresaDemo.propiedades],
  agentes: agentesDemo.length,
};

function reiniciar(): void {
  for (const ley of leyesBase) {
    ley.activa = estadoInicial.leyesActivas.get(ley.id) ?? ley.activa;
  }
  empresaDemo.capital = estadoInicial.capital;

  mundoEmpleados.length = 0;
  mundoEmpleados.push(...estadoInicial.empleados);
  empresaDemo.empleados.length = 0;
  empresaDemo.empleados.push(...estadoInicial.empleados);
  proximoIdEmpleado = mundoEmpleados.reduce((maximo, e) => Math.max(maximo, e.id), 0) + 1;

  for (const propiedad of propiedadesBase) {
    propiedad.dueño = estadoInicial.dueños.get(propiedad.id) ?? null;
  }
  empresaDemo.propiedades.length = 0;
  empresaDemo.propiedades.push(...estadoInicial.propiedadesEmpresa);

  agentesDemo.length = estadoInicial.agentes;
  aiCentral.agentes.length = estadoInicial.agentes;
}

export {
  crearAgente,
  crearEmpleado,
  comprarPropiedad,
  mundoDto,
  reiniciar,
  toggleLey,
  type NuevoAgente,
  type NuevoEmpleado,
};
