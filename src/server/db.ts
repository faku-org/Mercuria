// Persistencia del mundo en SQLite (bun:sqlite, sin dependencias externas).
// Guarda el estado "variable" de la simulación: economía, recursos, empresas,
// cotizaciones, leyes, histórico, plantilla y agentes.
//
// Ruta del archivo: env POLIMORFISMO_DB, por defecto <repo>/data/mundo.db.

import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface FilaPuntoEconomico {
  periodo: number;
  pib: number;
  productividadGlobal: number;
  contaminacion: number;
  indiceMercado: number;
}

export interface FilaEmpleado {
  id: number;
  nombre: string;
  tipo: string;
  sueldo: number;
  empresa: string;
  datos: string;
}

export interface EstadoPersistible {
  economia: {
    periodo: number;
    pibGlobal: number;
    pibAnterior: number;
    crecimiento: number;
    productividadGlobal: number;
    contaminacion: number;
    calidadAire: number;
    temperatura: number;
    biodiversidad: number;
  };
  recursos: { id: string; disponibilidad: number; precio: number }[];
  empresas: {
    nombre: string;
    capital: number;
    productividad: number;
    controladaPor: string | null;
  }[];
  cotizaciones: {
    empresa: string;
    precio: number;
    precioAnterior: number;
    precioInicial: number;
    cantidad: number;
  }[];
  leyes: { id: string; activa: boolean }[];
  puntos: FilaPuntoEconomico[];
  empleados: FilaEmpleado[];
  propiedades: { id: string; duenio: string | null }[];
  agentes: { id: string; nombre: string; modelo: string; sector: string; productividad: number }[];
}

const RUTA = process.env.POLIMORFISMO_DB ?? resolve(import.meta.dir, "../../data/mundo.db");
const EN_MEMORIA = RUTA === ":memory:";

if (!EN_MEMORIA) {
  mkdirSync(dirname(RUTA), { recursive: true });
}

export const db = new Database(RUTA);

db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS economia (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    periodo INTEGER NOT NULL,
    pib_global REAL NOT NULL,
    pib_anterior REAL NOT NULL,
    crecimiento REAL NOT NULL,
    productividad_global REAL NOT NULL,
    contaminacion REAL NOT NULL,
    calidad_aire REAL NOT NULL,
    temperatura REAL NOT NULL,
    biodiversidad REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recurso (
    id TEXT PRIMARY KEY,
    disponibilidad REAL NOT NULL,
    precio REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS empresa (
    nombre TEXT PRIMARY KEY,
    capital REAL NOT NULL,
    productividad REAL NOT NULL,
    controlada_por TEXT
  );

  CREATE TABLE IF NOT EXISTS cotizacion (
    empresa TEXT PRIMARY KEY,
    precio REAL NOT NULL,
    precio_anterior REAL NOT NULL,
    precio_inicial REAL NOT NULL,
    cantidad REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ley (
    id TEXT PRIMARY KEY,
    activa INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS punto_economico (
    periodo INTEGER PRIMARY KEY,
    pib REAL NOT NULL,
    productividad_global REAL NOT NULL,
    contaminacion REAL NOT NULL,
    indice_mercado REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS empleado (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    sueldo REAL NOT NULL,
    empresa TEXT NOT NULL,
    datos TEXT NOT NULL DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS propiedad (
    id TEXT PRIMARY KEY,
    duenio TEXT
  );

  CREATE TABLE IF NOT EXISTS agente (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    modelo TEXT NOT NULL,
    sector TEXT NOT NULL,
    productividad REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS meta (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  );
`);

/** ¿Hay un estado guardado? */
export function hayEstado(): boolean {
  const fila = db.query("SELECT COUNT(*) AS n FROM economia").get() as { n: number } | null;
  return (fila?.n ?? 0) > 0;
}

function vaciarTablas(): void {
  for (const tabla of [
    "economia",
    "recurso",
    "empresa",
    "cotizacion",
    "ley",
    "punto_economico",
    "empleado",
    "propiedad",
    "agente",
  ]) {
    db.run(`DELETE FROM ${tabla}`);
  }
}

/** Reemplaza el estado guardado por el que se le pasa. */
export function guardarEstado(estado: EstadoPersistible): void {
  const guardar = db.transaction((e: EstadoPersistible) => {
    vaciarTablas();

    const eco = e.economia;
    db.run(
      `INSERT INTO economia (id, periodo, pib_global, pib_anterior, crecimiento, productividad_global, contaminacion, calidad_aire, temperatura, biodiversidad)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eco.periodo,
        eco.pibGlobal,
        eco.pibAnterior,
        eco.crecimiento,
        eco.productividadGlobal,
        eco.contaminacion,
        eco.calidadAire,
        eco.temperatura,
        eco.biodiversidad,
      ],
    );

    for (const fila of e.recursos) {
      db.run("INSERT INTO recurso (id, disponibilidad, precio) VALUES (?, ?, ?)", [
        fila.id,
        fila.disponibilidad,
        fila.precio,
      ]);
    }

    for (const fila of e.empresas) {
      db.run(
        "INSERT INTO empresa (nombre, capital, productividad, controlada_por) VALUES (?, ?, ?, ?)",
        [fila.nombre, fila.capital, fila.productividad, fila.controladaPor],
      );
    }

    for (const fila of e.cotizaciones) {
      db.run(
        "INSERT INTO cotizacion (empresa, precio, precio_anterior, precio_inicial, cantidad) VALUES (?, ?, ?, ?, ?)",
        [fila.empresa, fila.precio, fila.precioAnterior, fila.precioInicial, fila.cantidad],
      );
    }

    for (const fila of e.leyes) {
      db.run("INSERT INTO ley (id, activa) VALUES (?, ?)", [fila.id, fila.activa ? 1 : 0]);
    }

    for (const fila of e.puntos) {
      db.run(
        "INSERT INTO punto_economico (periodo, pib, productividad_global, contaminacion, indice_mercado) VALUES (?, ?, ?, ?, ?)",
        [fila.periodo, fila.pib, fila.productividadGlobal, fila.contaminacion, fila.indiceMercado],
      );
    }

    for (const fila of e.empleados) {
      db.run(
        "INSERT INTO empleado (id, nombre, tipo, sueldo, empresa, datos) VALUES (?, ?, ?, ?, ?, ?)",
        [fila.id, fila.nombre, fila.tipo, fila.sueldo, fila.empresa, fila.datos],
      );
    }

    for (const fila of e.propiedades) {
      db.run("INSERT INTO propiedad (id, duenio) VALUES (?, ?)", [fila.id, fila.duenio]);
    }

    for (const fila of e.agentes) {
      db.run(
        "INSERT INTO agente (id, nombre, modelo, sector, productividad) VALUES (?, ?, ?, ?, ?)",
        [fila.id, fila.nombre, fila.modelo, fila.sector, fila.productividad],
      );
    }
  });

  guardar(estado);
}

/** Lee el estado guardado, o `null` si todavía no hay ninguno. */
export function cargarEstado(): EstadoPersistible | null {
  const eco = db
    .query(
      "SELECT periodo, pib_global, pib_anterior, crecimiento, productividad_global, contaminacion, calidad_aire, temperatura, biodiversidad FROM economia WHERE id = 1",
    )
    .get() as Record<string, number> | null;
  if (!eco) return null;

  const recursos = db
    .query("SELECT id, disponibilidad, precio FROM recurso")
    .all() as EstadoPersistible["recursos"];
  const empresas = db
    .query("SELECT nombre, capital, productividad, controlada_por AS controladaPor FROM empresa")
    .all() as EstadoPersistible["empresas"];
  const cotizaciones = db
    .query(
      "SELECT empresa, precio, precio_anterior AS precioAnterior, precio_inicial AS precioInicial, cantidad FROM cotizacion",
    )
    .all() as EstadoPersistible["cotizaciones"];
  const leyes = (
    db.query("SELECT id, activa FROM ley").all() as { id: string; activa: number }[]
  ).map((fila) => ({ id: fila.id, activa: fila.activa === 1 }));
  const puntos = db
    .query(
      "SELECT periodo, pib, productividad_global AS productividadGlobal, contaminacion, indice_mercado AS indiceMercado FROM punto_economico ORDER BY periodo",
    )
    .all() as FilaPuntoEconomico[];
  const empleados = db
    .query("SELECT id, nombre, tipo, sueldo, empresa, datos FROM empleado")
    .all() as FilaEmpleado[];
  const propiedades = db
    .query("SELECT id, duenio FROM propiedad")
    .all() as EstadoPersistible["propiedades"];
  const agentes = db
    .query("SELECT id, nombre, modelo, sector, productividad FROM agente")
    .all() as EstadoPersistible["agentes"];

  return {
    economia: {
      periodo: eco.periodo ?? 0,
      pibGlobal: eco.pib_global ?? 0,
      pibAnterior: eco.pib_anterior ?? 0,
      crecimiento: eco.crecimiento ?? 0,
      productividadGlobal: eco.productividad_global ?? 1,
      contaminacion: eco.contaminacion ?? 0,
      calidadAire: eco.calidad_aire ?? 1,
      temperatura: eco.temperatura ?? 0,
      biodiversidad: eco.biodiversidad ?? 1,
    },
    recursos,
    empresas,
    cotizaciones,
    leyes,
    puntos,
    empleados,
    propiedades,
    agentes,
  };
}

/** Guarda la "semilla": el estado al que vuelve `reiniciar`. */
export function guardarSemilla(estado: EstadoPersistible): void {
  db.run(
    "INSERT INTO meta (clave, valor) VALUES ('semilla', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor",
    [JSON.stringify(estado)],
  );
}

/** Lee la semilla, si existe. */
export function cargarSemilla(): EstadoPersistible | null {
  const fila = db.query("SELECT valor FROM meta WHERE clave = 'semilla'").get() as {
    valor: string;
  } | null;
  if (!fila) return null;
  try {
    return JSON.parse(fila.valor) as EstadoPersistible;
  } catch {
    return null;
  }
}

/** Borra todo (útil para tests y para un reset total). */
export function vaciarTodo(): void {
  vaciarTablas();
  db.run("DELETE FROM meta");
}
