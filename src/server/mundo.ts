// Estado del mundo simulado y mapeo a DTOs.
// El estado variable (economía, recursos, empresas, cotizaciones, leyes,
// histórico, plantilla, propiedades y agentes) se persiste en SQLite.

import type AI from "../domain/AI";
import Agente from "../domain/Agente";
import type Empleado from "../domain/Empleado";
import EmpleadoFijo from "../domain/EmpleadoFijo";
import EmpleadoPorHora from "../domain/EmpleadoPorHora";
import Empresa from "../domain/Empresa";
import type Estado from "../domain/Estado";
import Jefe from "../domain/Jefe";
import type Ley from "../domain/Ley";
import type Nacion from "../domain/Nacion";
import type Propiedad from "../domain/Propiedad";
import type Recurso from "../domain/Recurso";
import Usuario, { handleValido, normalizarHandle } from "../domain/Usuario";
import Vendedor from "../domain/Vendedor";
import agentesDemo, { aiCentral } from "../fixtures/aiBase";
import { economiaDemo } from "../fixtures/economiaBase";
import empleadosBase, { empresaDemo } from "../fixtures/empleadosBase";
import empresasBase from "../fixtures/empresasBase";
import estadosBase from "../fixtures/estadosBase";
import leyesBase, { leyesGlobales } from "../fixtures/leyesBase";
import mercadoDemo from "../fixtures/mercadoBase";
import nacionesBase from "../fixtures/nacionesBase";
import propiedadesBase, { anaDuenia } from "../fixtures/propiedadesBase";
import { resumenLeyes } from "../services/leyes";
import { calcularNomina, totalNomina, totalNominaFinal } from "../services/nomina";
import { predecir } from "../services/prediccion";
import { avanzarPeriodos as correrPeriodos } from "../services/simulacion";
import { publicar } from "./eventos";
import {
  actualizarUltimoVisto,
  cargarEstado,
  cargarEventos,
  cargarSemilla,
  cargarUsuarios,
  guardarEstado,
  guardarSemilla,
  guardarUsuario,
  hayEstado,
  registrarEvento,
  type EstadoPersistible,
  type FilaEmpleado,
  type FilaEvento,
} from "./db";

/** Nómina viva (mutable): los empleados que existen hoy en el mundo. */
const mundoEmpleados: Empleado[] = [...empleadosBase];
/** Empresas vivas del mundo (Nova Labs y Acero del Sur no tienen plantilla). */
const mundoEmpresas: Empresa[] = empresasBase;
const mercado = mercadoDemo;
const economia = economiaDemo;
let proximoIdEmpleado = mundoEmpleados.reduce((maximo, e) => Math.max(maximo, e.id), 0) + 1;

/** Períodos simulados al sembrar, para que haya histórico que graficar. */
const PERIODOS_INICIALES = 12;

/** Usuarios registrados (por handle) y sesiones activas (token → handle). */
const usuarios = new Map<string, Usuario>();
const sesiones = new Map<string, string>();

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
  return { ...nacionDto(estado), nacion: estado.nacion.nombre };
}

function empleadoDto(empleado: Empleado) {
  const base = empleado.calcularSueldo();
  const final = empleado.sueldoConLeyes(leyesGlobales, economia.productividadGlobal);
  return {
    id: empleado.id,
    nombre: empleado.nombre,
    tipo: empleado.constructor.name,
    tipoSueldo: empleado.tipoSueldo(),
    sueldoBase: base,
    factorLeyes:
      base === 0 ? 0 : Number((final.monto / base / economia.productividadGlobal - 1).toFixed(6)),
    factorProductividad: economia.productividadGlobal,
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
    // Sin ñ: el nombre del campo tiene que ser válido en GraphQL.
    duenio: propiedad.dueño?.nombre ?? null,
  };
}

function recursoDto(recurso: Recurso) {
  return {
    id: recurso.id,
    nombre: recurso.nombre,
    tipo: recurso.tipo,
    unidad: recurso.unidad,
    disponibilidad: Number(recurso.disponibilidad.toFixed(4)),
    escasez: Number(recurso.escasez().toFixed(4)),
    precio: recurso.precio,
  };
}

function ambienteDto() {
  const ambiente = economia.ambiente;
  return {
    contaminacion: Number(ambiente.contaminacion.toFixed(4)),
    calidadAire: Number(ambiente.calidadAire.toFixed(4)),
    temperatura: Number(ambiente.temperatura.toFixed(4)),
    biodiversidad: Number(ambiente.biodiversidad.toFixed(4)),
    impacto: ambiente.impacto(),
  };
}

function empresaDto(empresa: Empresa) {
  const cotizacion = mercado.cotizacionDe(empresa);
  return {
    nombre: empresa.nombre,
    id: empresa.id,
    capital: Number(empresa.capital.toFixed(2)),
    productividad: Number(empresa.productividad.toFixed(4)),
    acciones: empresa.acciones,
    intensidadEmision: empresa.intensidadEmision,
    nacion: empresa.nacion?.nombre ?? null,
    estado: empresa.estado?.nombre ?? null,
    jefe: empresa.jefe?.nombre ?? null,
    ai: empresa.ai?.nombre ?? null,
    capitalizacion: mercado.capitalizacion(empresa),
    precioAccion: cotizacion?.precio ?? null,
    variacion: cotizacion?.variacion ?? null,
    valorContable: empresa.valorContable(),
    aportePib: empresa.produccion(economia.factorRecursos(), economia.ambiente.impacto()),
    esControlada: empresa.esControlada,
    controladaPor: empresa.controladaPor?.nombre ?? null,
    duenio: empresa.duenio?.handle ?? null,
    esDeUsuario: empresa.esDeUsuario,
    subsidiarias: empresa.subsidiarias.map((subsidiaria) => subsidiaria.nombre),
    empleados: empresa.empleados.map(empleadoDto),
    propiedades: empresa.propiedades.map(propiedadDto),
    nominaTotal: Number(empresa.nominaTotal().toFixed(2)),
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
    productividad: ai.productividad,
    empresaMatriz: ai.empresaMatriz.nombre,
    asi: ai.asi,
    rogue: ai.rogue,
    sueldoBase: ai.sueldoBase,
    sueldoFinal: ai.sueldoConLeyes(leyesGlobales, economia.productividadGlobal).monto,
    empresas: ai.empresas.map((empresa) => empresa.nombre),
    agentes: ai.agentes.map(agenteDto),
  };
}

function economiaDto() {
  return {
    periodo: economia.periodo,
    pibGlobal: economia.pibGlobal,
    pibAnterior: economia.pibAnterior,
    crecimiento: economia.crecimiento,
    productividadGlobal: economia.productividadGlobal,
    disponibilidadMedia: economia.disponibilidadMedia(),
    factorRecursos: economia.factorRecursos(),
    ambiente: ambienteDto(),
    recursos: economia.recursos.map(recursoDto),
    historico: economia.historico,
  };
}

function mercadoDto() {
  return {
    indice: mercado.indice(),
    cotizaciones: mercado.cotizaciones.map((cotizacion) => ({
      empresa: cotizacion.empresa.nombre,
      precio: cotizacion.precio,
      precioAnterior: cotizacion.precioAnterior,
      cantidad: cotizacion.cantidad,
      capitalizacion: cotizacion.capitalizacion,
      variacion: cotizacion.variacion,
      indice: cotizacion.indice,
    })),
  };
}

function nominaDto() {
  return {
    lineas: calcularNomina(mundoEmpleados, leyesGlobales, economia.productividadGlobal),
    totalBase: totalNomina(mundoEmpleados),
    totalFinal: totalNominaFinal(mundoEmpleados, leyesGlobales, economia.productividadGlobal),
    productividadGlobal: economia.productividadGlobal,
  };
}

function resumenLeyesDto() {
  const resumen = resumenLeyes(leyesBase);
  return {
    total: resumen.total,
    activas: resumen.activas,
    sueldo: resumen.factores.sueldo,
    empresa: resumen.factores.empresa,
    propiedad: resumen.factores.propiedad,
    ai: resumen.factores.ai,
  };
}

/** Empresas del mundo, ya mapeadas a DTO. */
function listaEmpresas() {
  return mundoEmpresas.map(empresaDto);
}

/** Estado completo del mundo, listo para serializar. */
function mundoDto() {
  return {
    generado: new Date().toISOString(),
    naciones: nacionesBase.map(nacionDto),
    estados: estadosBase.map(estadoDto),
    leyes: leyesBase.map(leyDto),
    resumenLeyes: resumenLeyesDto(),
    empresas: listaEmpresas(),
    empleados: mundoEmpleados.map(empleadoDto),
    nomina: nominaDto(),
    propiedades: propiedadesBase.map(propiedadDto),
    ais: [aiDto(aiCentral)],
    economia: economiaDto(),
    mercado: mercadoDto(),
  };
}

function empresaPorNombre(nombre: string) {
  const empresa = mundoEmpresas.find((candidata) => candidata.nombre === nombre);
  return empresa ? empresaDto(empresa) : null;
}

function leyPorId(id: string) {
  const ley = leyesBase.find((candidata) => candidata.id === id);
  return ley ? leyDto(ley) : null;
}

// --- Estado persistible -----------------------------------------------------

/** Serializa los datos propios de la subclase (los que no están en `Empleado`). */
function datosEmpleado(empleado: Empleado): string {
  const datos: Record<string, number | string> = {};
  if (empleado instanceof EmpleadoPorHora) {
    datos.horasTrabajadas = empleado.horasTrabajadas;
    datos.tarifaPorHora = empleado.tarifaPorHora;
  }
  if (empleado instanceof Vendedor) {
    datos.ventas = empleado.ventas;
    datos.porcentajeComision = empleado.porcentajeComision;
  }
  if (empleado instanceof Jefe) {
    datos.departamento = empleado.departamento;
    datos.sueldo = empleado.sueldo;
  }
  return JSON.stringify(datos);
}

/** Reconstruye un empleado a partir de una fila de SQLite. */
function reconstruirEmpleado(fila: FilaEmpleado): Empleado {
  const empresa =
    mundoEmpresas.find((candidata) => candidata.nombre === fila.empresa) ?? empresaDemo;
  const existente = empleadosBase.find((empleado) => empleado.id === fila.id);
  if (existente) {
    existente.nombre = fila.nombre;
    existente.empresa = empresa;
    return existente;
  }
  let datos: Record<string, number | string> = {};
  try {
    datos = JSON.parse(fila.datos || "{}") as Record<string, number | string>;
  } catch {
    datos = {};
  }
  switch (fila.tipo) {
    case "EmpleadoPorHora":
      return new EmpleadoPorHora(
        fila.nombre,
        fila.id,
        empresa,
        Number(datos.horasTrabajadas ?? 0),
        Number(datos.tarifaPorHora ?? 0),
      );
    case "Vendedor":
      return new Vendedor(
        fila.nombre,
        fila.id,
        empresa,
        Number(datos.sueldo ?? fila.sueldo),
        Number(datos.ventas ?? 0),
        Number(datos.porcentajeComision ?? 0),
      );
    case "Jefe":
      return new Jefe(
        Number(datos.sueldo ?? fila.sueldo),
        fila.nombre,
        fila.id,
        empresa,
        String(datos.departamento ?? "General"),
      );
    default:
      return new EmpleadoFijo(fila.nombre, fila.id, empresa);
  }
}

/** Foto del estado variable del mundo, lista para guardar. */
function capturarEstado(): EstadoPersistible {
  return {
    economia: {
      periodo: economia.periodo,
      pibGlobal: economia.pibGlobal,
      pibAnterior: economia.pibAnterior,
      crecimiento: economia.crecimiento,
      productividadGlobal: economia.productividadGlobal,
      contaminacion: economia.ambiente.contaminacion,
      calidadAire: economia.ambiente.calidadAire,
      temperatura: economia.ambiente.temperatura,
      biodiversidad: economia.ambiente.biodiversidad,
    },
    recursos: economia.recursos.map((recurso) => ({
      id: recurso.id,
      disponibilidad: recurso.disponibilidad,
      precio: recurso.precio,
    })),
    empresas: mundoEmpresas.map((empresa) => ({
      nombre: empresa.nombre,
      capital: empresa.capital,
      productividad: empresa.productividad,
      controladaPor: empresa.controladaPor?.nombre ?? null,
      duenio: empresa.duenio?.handle ?? null,
      capacidad: empresa.capacidad,
      acciones: empresa.acciones,
      intensidadEmision: empresa.intensidadEmision,
    })),
    cotizaciones: mercado.cotizaciones.map((cotizacion) => ({
      empresa: cotizacion.empresa.nombre,
      precio: cotizacion.precio,
      precioAnterior: cotizacion.precioAnterior,
      precioInicial: cotizacion.precioInicial,
      cantidad: cotizacion.cantidad,
    })),
    leyes: leyesBase.map((ley) => ({ id: ley.id, activa: ley.activa })),
    puntos: economia.historico.map((punto) => ({ ...punto })),
    empleados: mundoEmpleados.map((empleado) => ({
      id: empleado.id,
      nombre: empleado.nombre,
      tipo: empleado.constructor.name,
      sueldo: empleado.sueldo,
      empresa: empleado.empresa.nombre,
      datos: datosEmpleado(empleado),
    })),
    propiedades: propiedadesBase.map((propiedad) => ({
      id: propiedad.id,
      duenio: propiedad.dueño?.nombre ?? null,
    })),
    agentes: aiCentral.agentes.map((agente) => ({
      id: agente.id,
      nombre: agente.nombre,
      modelo: agente.modelo,
      sector: agente.sector,
      productividad: agente.productividad,
    })),
  };
}

/** Aplica un estado guardado sobre los objetos del dominio. */
function aplicarEstado(estado: EstadoPersistible): void {
  for (const fila of estado.leyes) {
    const ley = leyesBase.find((candidata) => candidata.id === fila.id);
    if (ley) ley.activa = fila.activa;
  }

  // Las empresas pueden venir de los fixtures o haber sido fundadas por un
  // usuario en runtime: si no existe, se crea desde el estado guardado.
  for (const usuario of usuarios.values()) usuario.empresas = [];
  for (const fila of estado.empresas) {
    let empresa = mundoEmpresas.find((candidata) => candidata.nombre === fila.nombre);
    if (!empresa) {
      const id = mundoEmpresas.reduce((maximo, candidata) => Math.max(maximo, candidata.id), 0) + 1;
      empresa = new Empresa(fila.nombre, id, [], fila.capital, [], {
        productividad: fila.productividad,
        capacidad: fila.capacidad,
        acciones: fila.acciones,
        intensidadEmision: fila.intensidadEmision,
      });
      mundoEmpresas.push(empresa);
    }
    empresa.capital = fila.capital;
    empresa.productividad = fila.productividad;
    if (fila.capacidad !== undefined && fila.capacidad !== null) empresa.capacidad = fila.capacidad;
    if (fila.acciones !== undefined && fila.acciones !== null) empresa.acciones = fila.acciones;
    if (fila.intensidadEmision !== undefined && fila.intensidadEmision !== null) {
      empresa.intensidadEmision = fila.intensidadEmision;
    }
    if (fila.controladaPor === null) {
      empresa.controladaPor = null;
    } else if (fila.controladaPor === aiCentral.nombre) {
      empresa.controladaPor = aiCentral;
    } else {
      empresa.controladaPor = mundoEmpresas.find((c) => c.nombre === fila.controladaPor) ?? null;
    }
    const duenio = fila.duenio ? usuarios.get(fila.duenio) : undefined;
    empresa.duenio = duenio ?? null;
    if (duenio) duenio.agregarEmpresa(empresa);
  }

  // Subsidiarias y cartera de la IA se derivan del control.
  for (const empresa of mundoEmpresas) empresa.subsidiarias = [];
  for (const empresa of mundoEmpresas) {
    const controladora = empresa.controladaPor;
    if (controladora && "subsidiarias" in controladora) controladora.subsidiarias.push(empresa);
  }
  aiCentral.empresas = mundoEmpresas.filter((empresa) => empresa.controladaPor === aiCentral);

  for (const fila of estado.recursos) {
    const recurso = economia.recursos.find((candidato) => candidato.id === fila.id);
    if (!recurso) continue;
    recurso.disponibilidad = fila.disponibilidad;
    recurso.precio = fila.precio;
  }

  // Asegura que cada empresa guardada tenga su cotización (las fundadas por
  // usuarios no están en `mercadoBase`).
  for (const fila of estado.cotizaciones) {
    const empresa = mundoEmpresas.find((candidata) => candidata.nombre === fila.empresa);
    if (empresa && !mercado.cotizacionDe(empresa)) {
      mercado.listarEmpresa(empresa, fila.precio, fila.cantidad);
    }
  }
  for (const cotizacion of mercado.cotizaciones) {
    const fila = estado.cotizaciones.find((c) => c.empresa === cotizacion.empresa.nombre);
    if (!fila) continue;
    cotizacion.precio = fila.precio;
    cotizacion.precioAnterior = fila.precioAnterior;
    cotizacion.precioInicial = fila.precioInicial;
    cotizacion.cantidad = fila.cantidad;
  }

  mundoEmpleados.length = 0;
  for (const empresa of mundoEmpresas) empresa.empleados.length = 0;
  for (const fila of estado.empleados) {
    const empleado = reconstruirEmpleado(fila);
    mundoEmpleados.push(empleado);
    empleado.empresa.contratar(empleado);
  }
  proximoIdEmpleado = mundoEmpleados.reduce((maximo, e) => Math.max(maximo, e.id), 0) + 1;

  for (const fila of estado.propiedades) {
    const propiedad = propiedadesBase.find((candidata) => candidata.id === fila.id);
    if (!propiedad) continue;
    if (fila.duenio === null) {
      propiedad.dueño = null;
    } else if (fila.duenio === anaDuenia.nombre) {
      propiedad.dueño = anaDuenia;
    } else {
      propiedad.dueño = mundoEmpresas.find((e) => e.nombre === fila.duenio) ?? null;
    }
  }

  aiCentral.agentes.length = 0;
  agentesDemo.length = 0;
  for (const fila of estado.agentes) {
    const agente = new Agente(fila.nombre, fila.modelo, aiCentral, fila.sector, fila.productividad);
    agente.id = fila.id;
    agentesDemo.push(agente);
  }

  economia.periodo = estado.economia.periodo;
  economia.pibGlobal = estado.economia.pibGlobal;
  economia.pibAnterior = estado.economia.pibAnterior;
  economia.crecimiento = estado.economia.crecimiento;
  economia.productividadGlobal = estado.economia.productividadGlobal;
  economia.ambiente.contaminacion = estado.economia.contaminacion;
  economia.ambiente.calidadAire = estado.economia.calidadAire;
  economia.ambiente.temperatura = estado.economia.temperatura;
  economia.ambiente.biodiversidad = estado.economia.biodiversidad;
  economia.historico = estado.puntos.map((punto) => ({ ...punto }));
}

/** Guarda el estado variable en SQLite y avisa a los clientes en vivo. */
function persistir(): void {
  guardarEstado(capturarEstado());
  publicar();
}

// Arranque: si hay estado guardado se carga; si no, se siembra la simulación y
// se guarda tanto el estado como la semilla (a la que vuelve `reiniciar`).
// Los usuarios se cargan antes de aplicar el estado, para vincular sus empresas.
for (const fila of cargarUsuarios()) {
  usuarios.set(
    fila.handle,
    new Usuario(fila.handle, fila.nombre, fila.hashPin, fila.creadoEn, fila.ultimoVisto),
  );
}

if (hayEstado()) {
  const guardado = cargarEstado();
  if (guardado) aplicarEstado(guardado);
} else {
  correrPeriodos({ economia, empresas: mundoEmpresas, mercado }, PERIODOS_INICIALES);
  const inicial = capturarEstado();
  guardarEstado(inicial);
  guardarSemilla(inicial);
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
  persistir();
  return empleado;
}

function toggleLey(id: string): Ley | undefined {
  const ley = leyesBase.find((candidata) => candidata.id === id);
  if (!ley) return undefined;
  ley.activa = !ley.activa;
  persistir();
  return ley;
}

function comprarPropiedad(id: string): { ok: boolean; motivo?: string } {
  const propiedad = propiedadesBase.find((candidata) => candidata.id === id);
  if (!propiedad) return { ok: false, motivo: "Propiedad inexistente" };
  const comprada = empresaDemo.comprarPropiedad(propiedad);
  if (comprada) persistir();
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
  persistir();
  return agente;
}

/**
 * Corre N períodos de simulación. Con `guardar = false` (usado por el reloj en
 * vivo) no escribe en SQLite, pero sí publica el cambio para los clientes.
 */
function avanzar(periodos: number = 1, guardar: boolean = true): ReturnType<typeof economiaDto> {
  correrPeriodos({ economia, empresas: mundoEmpresas, mercado }, periodos);
  if (guardar) {
    persistir();
  } else {
    publicar();
  }
  return economiaDto();
}

/** Fuerza el guardado del estado (lo usa el reloj para no escribir cada tick). */
function persistirMundo(): void {
  persistir();
}

/**
 * Proyecta la economía `periodos` hacia adelante sobre una copia aislada del
 * mundo (ver `services/prediccion.ts`). No altera el estado real.
 */
function prediccionDto(periodos: number) {
  const cantidad = Math.max(0, Math.min(240, Math.floor(periodos)));
  const puntos = predecir({ economia, empresas: mundoEmpresas, mercado }, cantidad);
  const ultimo = puntos[puntos.length - 1];
  return {
    periodos: cantidad,
    periodoInicial: economia.periodo,
    puntos,
    pibFinal: ultimo?.pib ?? economia.pibGlobal,
    productividadFinal: ultimo?.productividadGlobal ?? economia.productividadGlobal,
    indiceFinal: ultimo?.indiceMercado ?? mercado.indice(),
  };
}

/** Fija la productividad de una empresa por nombre. */
function ajustarProductividad(nombreEmpresa: string, valor: number): Empresa | undefined {
  const empresa = mundoEmpresas.find((candidata) => candidata.nombre === nombreEmpresa);
  if (!empresa) return undefined;
  empresa.ajustarProductividad(valor);
  economia.recalcularProductividadGlobal(mundoEmpresas);
  persistir();
  return empresa;
}

/** Adquiere una empresa vía mercado; `porIA` usa la IA en vez de la empresa demo. */
function adquirirEmpresa(
  nombreObjetivo: string,
  porIA: boolean = false,
): { ok: boolean; costo: number; motivo?: string; comprador?: string; objetivo?: string } {
  const objetivo = mundoEmpresas.find((candidata) => candidata.nombre === nombreObjetivo);
  if (!objetivo) return { ok: false, costo: 0, motivo: "Empresa inexistente" };

  const resultado = porIA
    ? aiCentral.adquirir(mercado, objetivo)
    : mercado.adquirir(empresaDemo, objetivo);

  if (resultado.ok) {
    anotarEvento(
      "adquisicion",
      `${porIA ? aiCentral.nombre : empresaDemo.nombre} adquirió ${objetivo.nombre} por ${resultado.costo}`,
      null,
      objetivo.nombre,
    );
    persistir();
  }

  return {
    ...resultado,
    comprador: porIA ? aiCentral.nombre : empresaDemo.nombre,
    objetivo: objetivo.nombre,
  };
}

/** Vuelve al estado semilla (el que se sembró la primera vez). */
function reiniciar(): void {
  const semilla = cargarSemilla();
  if (!semilla) return;

  // Las empresas fundadas por usuarios no están en la semilla: se eliminan.
  for (const empresa of mundoEmpresas.filter((empresa) => empresa.duenio)) {
    empresa.duenio?.quitarEmpresa(empresa);
    mundoEmpresas.splice(mundoEmpresas.indexOf(empresa), 1);
  }
  mercado.cotizaciones = mercado.cotizaciones.filter((cotizacion) =>
    mundoEmpresas.includes(cotizacion.empresa),
  );

  aplicarEstado(semilla);
  guardarEstado(semilla);
  publicar();
}

// --- Usuarios y sesiones ------------------------------------------------------

/** Anota un evento en la bitácora del mundo. */
function anotarEvento(
  tipo: string,
  descripcion: string,
  handle: string | null = null,
  empresa: string | null = null,
): void {
  registrarEvento({ periodo: economia.periodo, tipo, descripcion, handle, empresa });
}

function crearSesion(handle: string): string {
  const token = `ses_${crypto.randomUUID()}`;
  sesiones.set(token, handle);
  return token;
}

/** Usuario dueño de una sesión, o `null`. */
function sesionDeToken(token?: string | null): Usuario | null {
  if (!token) return null;
  const handle = sesiones.get(token);
  if (!handle) return null;
  return usuarios.get(handle) ?? null;
}

/** Perfil del usuario de la sesión, listo para GraphQL. */
function usuarioActual(token?: string | null) {
  return sesionDeToken(token)?.perfil ?? null;
}

function cerrarSesion(token?: string | null): void {
  if (token) sesiones.delete(token);
}

/** Registra un usuario nuevo (handle único + PIN hasheado). */
async function registrarUsuario(handleEntrada: string, pin: string, nombre?: string) {
  const handle = normalizarHandle(handleEntrada);
  if (!handleValido(handle)) {
    throw new Error("Handle inválido: 3 a 20 caracteres (minúsculas, números o guion bajo).");
  }
  if (!/^\d{4,8}$/.test(pin)) {
    throw new Error("El PIN debe tener entre 4 y 8 dígitos.");
  }
  if (usuarios.has(handle)) throw new Error("Ese handle ya está registrado.");

  const hashPin = await Bun.password.hash(pin);
  const usuario = new Usuario(
    handle,
    (nombre ?? "").trim() || handle,
    hashPin,
    new Date().toISOString(),
    economia.periodo,
  );
  usuarios.set(handle, usuario);
  guardarUsuario({
    handle: usuario.handle,
    nombre: usuario.nombre,
    hashPin: usuario.hashPin,
    creadoEn: usuario.creadoEn,
    ultimoVisto: usuario.ultimoVisto,
  });
  anotarEvento("usuario", `Nuevo usuario ${handle}`);
  return { token: crearSesion(handle), usuario: usuario.perfil };
}

/** Inicia sesión de un usuario existente. */
async function loginUsuario(handleEntrada: string, pin: string) {
  const handle = normalizarHandle(handleEntrada);
  const usuario = usuarios.get(handle);
  if (!usuario || !(await Bun.password.verify(pin, usuario.hashPin))) {
    throw new Error("Usuario o PIN incorrecto.");
  }
  return { token: crearSesion(handle), usuario: usuario.perfil };
}

/** Marca hasta qué período vio el usuario (para el resumen de ausencia). */
function marcarVisto(usuario: Usuario, periodo: number = economia.periodo): void {
  usuario.ultimoVisto = periodo;
  actualizarUltimoVisto(usuario.handle, periodo);
}

function eventoDto(fila: FilaEvento) {
  return {
    id: fila.id,
    periodo: fila.periodo,
    tipo: fila.tipo,
    descripcion: fila.descripcion,
    handle: fila.handle,
    empresa: fila.empresa,
  };
}

/** Eventos de la bitácora desde un período. */
function eventosDesde(desde: number) {
  return cargarEventos(Math.max(0, Math.floor(desde))).map(eventoDto);
}

// --- Empresas de usuarios -----------------------------------------------------

/** Precio de salida de una empresa recién fundada. */
const PRECIO_EMPRESA_NUEVA = 100;

/** Funda una empresa propia del usuario. */
function fundarEmpresa(usuario: Usuario, nombre: string, capitalInicial: number = 1_000_000) {
  const nombreLimpio = nombre.trim();
  if (nombreLimpio.length < 3) throw new Error("El nombre debe tener al menos 3 caracteres.");
  if (mundoEmpresas.some((empresa) => empresa.nombre.toLowerCase() === nombreLimpio.toLowerCase())) {
    throw new Error("Ya existe una empresa con ese nombre.");
  }

  const id = mundoEmpresas.reduce((maximo, empresa) => Math.max(maximo, empresa.id), 0) + 1;
  const capital = Math.max(0, Number(capitalInicial) || 0);
  const empresa = new Empresa(nombreLimpio, id, [], capital, [], {
    nacion: nacionesBase[0],
    acciones: 10_000,
    duenio: usuario,
  });
  mundoEmpresas.push(empresa);
  usuario.agregarEmpresa(empresa);
  mercado.listarEmpresa(empresa, PRECIO_EMPRESA_NUEVA, empresa.acciones);
  anotarEvento(
    "fundacion",
    `${usuario.handle} fundó ${empresa.nombre}`,
    usuario.handle,
    empresa.nombre,
  );
  persistir();
  return empresaDto(empresa);
}

/** Una empresa del usuario adquiere otra empresa del sistema. */
function adquirirEmpresaUsuario(
  usuario: Usuario,
  objetivoNombre: string,
  compradorNombre?: string,
): { ok: boolean; costo: number; motivo?: string; comprador?: string; objetivo?: string } {
  const objetivo = mundoEmpresas.find((empresa) => empresa.nombre === objetivoNombre);
  if (!objetivo) return { ok: false, costo: 0, motivo: "Empresa inexistente" };
  if (objetivo.duenio === usuario) return { ok: false, costo: 0, motivo: "Ya es tuya" };

  const comprador = compradorNombre
    ? usuario.empresas.find((empresa) => empresa.nombre === compradorNombre)
    : usuario.empresas[0];
  if (!comprador) {
    return { ok: false, costo: 0, motivo: "Necesitás al menos una empresa para adquirir" };
  }

  const resultado = mercado.adquirir(comprador, objetivo);
  if (resultado.ok) {
    objetivo.duenio = usuario;
    usuario.agregarEmpresa(objetivo);
    anotarEvento(
      "adquisicion",
      `${usuario.handle} adquirió ${objetivo.nombre} por ${resultado.costo}`,
      usuario.handle,
      objetivo.nombre,
    );
    persistir();
  }
  return { ...resultado, comprador: comprador.nombre, objetivo: objetivo.nombre };
}

/** Resumen de lo que pasó desde la última vez que el usuario miró. */
function resumenDto(usuario: Usuario) {
  const desde = usuario.ultimoVisto;
  const hasta = economia.periodo;
  const puntos = economia.historico.filter((punto) => punto.periodo >= desde);
  const primero = puntos[0] ?? null;
  const ultimo = puntos[puntos.length - 1] ?? null;
  const eventos = cargarEventos(desde)
    .filter((evento) => evento.handle === null || evento.handle === usuario.handle)
    .map(eventoDto);

  const resumen = {
    desde,
    hasta,
    periodos: Math.max(0, hasta - desde),
    pibInicio: primero?.pib ?? economia.pibGlobal,
    pibFin: ultimo?.pib ?? economia.pibGlobal,
    productividadInicio: primero?.productividadGlobal ?? economia.productividadGlobal,
    productividadFin: ultimo?.productividadGlobal ?? economia.productividadGlobal,
    contaminacionInicio: primero?.contaminacion ?? economia.ambiente.contaminacion,
    contaminacionFin: ultimo?.contaminacion ?? economia.ambiente.contaminacion,
    indiceInicio: primero?.indiceMercado ?? mercado.indice(),
    indiceFin: ultimo?.indiceMercado ?? mercado.indice(),
    empresas: usuario.empresas.map(empresaDto),
    eventos,
  };
  marcarVisto(usuario, hasta);
  return resumen;
}

/** Resumen de ausencia del usuario de la sesión, o `null`. */
function resumenActual(token?: string | null) {
  const usuario = sesionDeToken(token);
  return usuario ? resumenDto(usuario) : null;
}

export {
  adquirirEmpresa,
  adquirirEmpresaUsuario,
  ajustarProductividad,
  avanzar,
  cerrarSesion,
  comprarPropiedad,
  crearAgente,
  crearEmpleado,
  economiaDto,
  empresaPorNombre,
  eventosDesde,
  fundarEmpresa,
  leyPorId,
  listaEmpresas,
  loginUsuario,
  mercadoDto,
  mundoDto,
  persistirMundo,
  prediccionDto,
  registrarUsuario,
  reiniciar,
  resumenActual,
  resumenDto,
  sesionDeToken,
  toggleLey,
  usuarioActual,
  type NuevoAgente,
  type NuevoEmpleado,
};
