import { describe, expect, test } from "bun:test";

import AI from "../src/domain/AI";
import Agente from "../src/domain/Agente";
import EmpleadoFijo from "../src/domain/EmpleadoFijo";
import EmpleadoPorHora from "../src/domain/EmpleadoPorHora";
import Empresa from "../src/domain/Empresa";
import Estado from "../src/domain/Estado";
import Jefe from "../src/domain/Jefe";
import Ley from "../src/domain/Ley";
import LeyEstatal from "../src/domain/LeyEstatal";
import Nacion from "../src/domain/Nacion";
import Propiedad from "../src/domain/Propiedad";
import Vendedor from "../src/domain/Vendedor";

function nacionNueva(nombre = "Testland"): Nacion {
  return new Nacion(nombre, "Capital", "Idioma", 1000);
}

describe("cálculo polimórfico de sueldos", () => {
  const empresa = new Empresa("E", 1, [], 1_000_000, [], { nacion: nacionNueva() });

  test("empleado fijo cobra el sueldo mensual", () => {
    expect(new EmpleadoFijo("Ana", 1, empresa).calcularSueldo()).toBe(50000);
  });

  test("empleado por hora multiplica horas por tarifa", () => {
    expect(new EmpleadoPorHora("Beto", 2, empresa, 160, 2500).calcularSueldo()).toBe(400000);
  });

  test("vendedor suma la comisión al sueldo base", () => {
    expect(new Vendedor("Carla", 3, empresa, 30000, 500000, 5).calcularSueldo()).toBe(55000);
  });

  test("el mismo array mezcla tipos y cada uno calcula distinto", () => {
    const empleados = [
      new EmpleadoFijo("Ana", 1, empresa),
      new EmpleadoPorHora("Beto", 2, empresa, 10, 100),
      new Vendedor("Carla", 3, empresa, 1000, 1000, 10),
    ];
    expect(empleados.map((empleado) => empleado.calcularSueldo())).toEqual([50000, 1000, 1100]);
  });
});

describe("leyes", () => {
  test("una ley positiva aumenta el sueldo final", () => {
    const nacion = nacionNueva();
    nacion.registrarLey(
      new Ley("Plus", "desc", nacion, {
        objetivo: "sueldo",
        efecto: "positivo",
        magnitud: 0.1,
        activa: true,
      }),
    );
    const empleado = new EmpleadoFijo("Ana", 1, new Empresa("E", 1, [], 0, [], { nacion }));
    expect(empleado.calcularSueldo()).toBe(50000);
    expect(empleado.sueldoConLeyes().monto).toBe(55000);
  });

  test("una ley inactiva no afecta", () => {
    const nacion = nacionNueva();
    nacion.registrarLey(
      new Ley("Plus", "desc", nacion, {
        objetivo: "sueldo",
        efecto: "positivo",
        magnitud: 0.5,
        activa: false,
      }),
    );
    const empleado = new EmpleadoFijo("Ana", 1, new Empresa("E", 1, [], 0, [], { nacion }));
    expect(empleado.sueldoConLeyes().monto).toBe(50000);
  });

  test("el estado tiene prioridad sobre la nación", () => {
    const nacion = nacionNueva();
    nacion.registrarLey(
      new Ley("Nacional", "desc", nacion, {
        objetivo: "sueldo",
        efecto: "positivo",
        magnitud: 0.5,
        activa: true,
      }),
    );
    const estado = new Estado("California", "Sacramento", "English", 100, nacion);
    estado.registrarLey(
      new LeyEstatal("Estatal", "desc", estado, {
        objetivo: "sueldo",
        efecto: "negativo",
        magnitud: 0.2,
        activa: true,
      }),
    );
    expect(estado.factorLeyes("sueldo")).toBeCloseTo(-0.2, 5);
    expect(nacion.factorLeyes("sueldo")).toBeCloseTo(0.5, 5);
  });

  test("sin leyes estatales el estado hereda la nación", () => {
    const nacion = nacionNueva();
    nacion.registrarLey(
      new Ley("Nacional", "desc", nacion, {
        objetivo: "sueldo",
        efecto: "positivo",
        magnitud: 0.5,
        activa: true,
      }),
    );
    const estado = new Estado("California", "Sacramento", "English", 100, nacion);
    expect(estado.factorLeyes("sueldo")).toBeCloseTo(0.5, 5);
  });

  test("una ley global aplica a cualquier nación", () => {
    const nacion = nacionNueva();
    const global = new Ley("Global", "desc", nacion, {
      objetivo: "sueldo",
      efecto: "positivo",
      magnitud: 0.1,
      alcance: "global",
      activa: true,
    });
    const empleado = new EmpleadoFijo("Ana", 1, new Empresa("E", 1, [], 0, [], { nacion }));
    expect(empleado.sueldoConLeyes([global]).monto).toBe(55000);
  });

  test("el id de la ley usa las iniciales de la nación", () => {
    const nacion = nacionNueva("United States");
    const ley = new Ley("X", "desc", nacion);
    expect(ley.id.startsWith("US-")).toBe(true);
  });
});

describe("propiedades", () => {
  test("el precio refleja las leyes de la ubicación", () => {
    const nacion = nacionNueva();
    nacion.registrarLey(
      new Ley("Precio", "desc", nacion, {
        objetivo: "propiedad",
        efecto: "negativo",
        magnitud: 0.1,
        activa: true,
      }),
    );
    const propiedad = new Propiedad("Casa", 100000, { nacion });
    expect(propiedad.precioConLeyes()).toBe(90000);
  });

  test("la empresa compra y toma el título", () => {
    const nacion = nacionNueva();
    const empresa = new Empresa("E", 1, [], 200000, [], { nacion });
    const propiedad = new Propiedad("Casa", 100000, { nacion });
    expect(empresa.comprarPropiedad(propiedad)).toBe(true);
    expect(empresa.capital).toBe(100000);
    expect(propiedad.dueño).toBe(empresa);
    expect(empresa.propiedades).toHaveLength(1);
  });

  test("no compra sin capital suficiente", () => {
    const nacion = nacionNueva();
    const empresa = new Empresa("E", 1, [], 50000, [], { nacion });
    const propiedad = new Propiedad("Casa", 100000, { nacion });
    expect(empresa.comprarPropiedad(propiedad)).toBe(false);
    expect(propiedad.dueño).toBe(null);
  });
});

describe("empresa y jerarquía", () => {
  test("el jefe supervisa su equipo y suma el costo base", () => {
    const empresa = new Empresa("E", 1, [], 0, [], { nacion: nacionNueva() });
    const jefe = new Jefe(90000, "Dora", 1, empresa, "Operaciones");
    const empleado = new EmpleadoFijo("Ana", 2, empresa);
    jefe.supervisar(empleado);
    jefe.supervisar(empleado); // no duplica
    expect(jefe.equipo).toHaveLength(1);
    expect(jefe.costoEquipo()).toBe(50000);
  });
});

describe("AI y agentes", () => {
  test("una AI sin empresa matriz no se puede crear", () => {
    expect(() => new AI("X", "Claude", undefined as unknown as Empresa)).toThrow();
  });

  test("el agente se registra en su AI matriz y calcula su costo", () => {
    const empresa = new Empresa("E", 1, [], 0, [], { nacion: nacionNueva() });
    const ai = empresa.crearAI("Orion", "Claude 3.5", 100000);
    const agente = new Agente("Soporte", "Claude 3.5", ai, "soporte", 0.9);
    expect(ai.agentes).toHaveLength(1);
    expect(agente.empresaMatriz).toBe(empresa);
    expect(agente.costoUso()).toBeCloseTo(0.81, 5);
    expect(ai.agentesDeSector("soporte")).toHaveLength(1);
    expect(ai.agentesDeSector("ventas")).toHaveLength(0);
  });

  test("el sueldo de la AI responde a las leyes", () => {
    const nacion = nacionNueva();
    nacion.registrarLey(
      new Ley("IA", "desc", nacion, {
        objetivo: "ai",
        efecto: "negativo",
        magnitud: 0.2,
        activa: true,
      }),
    );
    const empresa = new Empresa("E", 1, [], 0, [], { nacion });
    const ai = empresa.crearAI("Orion", "Claude 3.5", 100000);
    expect(ai.sueldoConLeyes().monto).toBe(80000);
  });
});
