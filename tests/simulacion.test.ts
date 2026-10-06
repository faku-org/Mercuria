import { describe, expect, test } from "bun:test";

import Ambiente from "../src/domain/Ambiente";
import EmpleadoFijo from "../src/domain/EmpleadoFijo";
import Empresa from "../src/domain/Empresa";
import Economia from "../src/domain/Economia";
import Mercado from "../src/domain/Mercado";
import Nacion from "../src/domain/Nacion";
import Recurso from "../src/domain/Recurso";
import Sueldo from "../src/domain/Sueldo";
import { avanzarPeriodo, avanzarPeriodos } from "../src/services/simulacion";

function nacionNueva(nombre = "Testland"): Nacion {
  return new Nacion(nombre, "Capital", "Idioma", 1000);
}

describe("recursos", () => {
  test("la escasez y el precio responden a la disponibilidad", () => {
    const agua = new Recurso("Agua", "agua", "m3", { disponibilidad: 1, precioBase: 1 });
    expect(agua.escasez()).toBe(0);
    expect(agua.factorProduccion()).toBe(1);
    expect(agua.precio).toBe(1);

    agua.consumir(0.5);
    expect(agua.disponibilidad).toBeCloseTo(0.5, 6);
    expect(agua.escasez()).toBeCloseTo(0.5, 6);
    expect(agua.precio).toBeCloseTo(2, 4);
  });

  test("regenerar sube la disponibilidad y no pasa de 2", () => {
    const agua = new Recurso("Agua", "agua", "m3", { disponibilidad: 1.9, regeneracion: 0.5 });
    agua.regenerar();
    expect(agua.disponibilidad).toBe(2);
  });

  test("consumir no baja de 0", () => {
    const agua = new Recurso("Agua", "agua", "m3", { disponibilidad: 0.1 });
    agua.consumir(5);
    expect(agua.disponibilidad).toBe(0);
  });
});

describe("ambiente", () => {
  test("el impacto combina contaminación y calidad de aire", () => {
    const ambiente = new Ambiente(0.12, 0, 0.88);
    // 0.12*0.5 + 0*0.1 + (1-0.88)*0.2 = 0.084
    expect(ambiente.impacto()).toBeCloseTo(0.084, 6);
  });

  test("registrar emisiones degrada y acota el estado", () => {
    const ambiente = new Ambiente(0.5, 0, 0.5);
    ambiente.registrarEmision(1);
    expect(ambiente.contaminacion).toBe(1);
    expect(ambiente.calidadAire).toBe(0);
  });
});

describe("economía", () => {
  test("el factor de recursos multiplica las raíces de las disponibilidades", () => {
    const economia = new Economia([
      new Recurso("Agua", "agua", "m3", { disponibilidad: 1 }),
      new Recurso("Luz", "electricidad", "kWh", { disponibilidad: 0.25 }),
    ]);
    // 1 * sqrt(0.25) = 0.5
    expect(economia.factorRecursos()).toBeCloseTo(0.5, 6);
    expect(economia.disponibilidadMedia()).toBeCloseTo(0.625, 6);
  });

  test("el PIB y el crecimiento se recalculan", () => {
    const economia = new Economia();
    economia.recalcularPib([10, 20]);
    expect(economia.pibGlobal).toBe(30);
    expect(economia.crecimiento).toBe(0);

    economia.recalcularPib([15, 30]);
    expect(economia.pibGlobal).toBe(45);
    expect(economia.crecimiento).toBeCloseTo(0.5, 6);
  });

  test("la productividad global se pondera por capital", () => {
    const economia = new Economia();
    economia.recalcularProductividadGlobal([
      { productividad: 2, capital: 1 },
      { productividad: 0, capital: 3 },
    ]);
    expect(economia.productividadGlobal).toBeCloseTo(0.5, 6);
  });

  test("cerrarPeriodo guarda la muestra y avanza el contador", () => {
    const economia = new Economia();
    economia.recalcularPib([100]);
    economia.cerrarPeriodo(105);
    expect(economia.periodo).toBe(1);
    expect(economia.historico).toHaveLength(1);
    expect(economia.historico[0]?.pib).toBe(100);
    expect(economia.historico[0]?.indiceMercado).toBe(105);
  });
});

describe("empresa y productividad", () => {
  test("la producción depende del capital, la productividad y el entorno", () => {
    const empresa = new Empresa("E", 1, [], 1_000_000, [], { productividad: 1 });
    // 1e6 * 1 * 0.5 * (1 - 0.2) = 400000
    expect(empresa.produccion(0.5, 0.2)).toBeCloseTo(400000, 2);
  });

  test("la productividad se acota entre 0 y 2", () => {
    const empresa = new Empresa("E", 1);
    empresa.ajustarProductividad(9);
    expect(empresa.productividad).toBe(2);
    empresa.ajustarProductividad(-4);
    expect(empresa.productividad).toBe(0);
  });

  test("la capacidad estructural arranca en la productividad inicial", () => {
    const empresa = new Empresa("E", 1, [], 0, [], { productividad: 1.4 });
    expect(empresa.capacidad).toBe(1.4);
  });

  test("el valor contable suma capital, propiedades y subsidiarias", () => {
    const matriz = new Empresa("Matriz", 1, [], 1000, []);
    const hija = new Empresa("Hija", 2, [], 500, []);
    matriz.subsidiarias.push(hija);
    expect(matriz.valorContable()).toBe(1500);
  });
});

describe("mercado", () => {
  function armar() {
    const comprador = new Empresa("Compradora", 1, [], 100_000, []);
    const objetivo = new Empresa("Objetivo", 2, [], 10_000, []);
    const mercado = new Mercado();
    mercado.listarEmpresa(objetivo, 10, 1000);
    return { comprador, objetivo, mercado };
  }

  test("la capitalización es precio × acciones", () => {
    const { objetivo, mercado } = armar();
    expect(mercado.capitalizacion(objetivo)).toBe(10_000);
  });

  test("el costo de adquisición aplica la prima", () => {
    const { objetivo, mercado } = armar();
    expect(mercado.costoAdquisicion(objetivo)).toBeCloseTo(12_000, 2);
  });

  test("adquirir paga y toma el control", () => {
    const { comprador, objetivo, mercado } = armar();
    const resultado = mercado.adquirir(comprador, objetivo);
    expect(resultado.ok).toBe(true);
    expect(resultado.costo).toBeCloseTo(12_000, 2);
    expect(comprador.capital).toBeCloseTo(88_000, 2);
    expect(objetivo.controladaPor).toBe(comprador);
    expect(comprador.subsidiarias).toContain(objetivo);
  });

  test("no se puede adquirir sin capital", () => {
    const { objetivo, mercado } = armar();
    const pobre = new Empresa("Pobre", 3, [], 100, []);
    const resultado = mercado.adquirir(pobre, objetivo);
    expect(resultado.ok).toBe(false);
    expect(resultado.motivo).toBe("Capital insuficiente");
  });

  test("no se puede adquirir una empresa ya controlada", () => {
    const { comprador, objetivo, mercado } = armar();
    mercado.adquirir(comprador, objetivo);
    const otro = new Empresa("Otra", 4, [], 1_000_000, []);
    const resultado = mercado.adquirir(otro, objetivo);
    expect(resultado.ok).toBe(false);
    expect(resultado.motivo).toBe("Ya pertenece a otro grupo");
  });

  test("una IA adquiere con el capital de su empresa matriz", () => {
    const matriz = new Empresa("Matriz", 1, [], 100_000, [], { nacion: nacionNueva() });
    const objetivo = new Empresa("Objetivo", 2, [], 10_000, []);
    const mercado = new Mercado();
    mercado.listarEmpresa(objetivo, 10, 1000);
    const ai = matriz.crearAI("Orion", "Claude 3.5", 0);

    const resultado = ai.adquirir(mercado, objetivo);
    expect(resultado.ok).toBe(true);
    expect(matriz.capital).toBeCloseTo(88_000, 2);
    expect(objetivo.controladaPor).toBe(ai);
    expect(ai.empresas).toContain(objetivo);
  });

  test("el índice de mercado promedia los índices normalizados", () => {
    const a = new Empresa("A", 1, [], 0, []);
    const b = new Empresa("B", 2, [], 0, []);
    const mercado = new Mercado();
    mercado.listarEmpresa(a, 10, 100);
    mercado.listarEmpresa(b, 10, 100);
    expect(mercado.indice()).toBe(100);
    mercado.cotizar(a, 20);
    expect(mercado.indice()).toBe(150);
  });
});

describe("simulación", () => {
  test("un período mueve recursos, ambiente, PIB y mercado", () => {
    const economia = new Economia([
      new Recurso("Agua", "agua", "m3", { disponibilidad: 1, regeneracion: 0.02, consumoBase: 1 }),
    ]);
    const empresa = new Empresa("E", 1, [], 5_000_000, [], { productividad: 1 });
    const mercado = new Mercado();
    mercado.listarEmpresa(empresa, 100, 1000);
    const mundo = { economia, empresas: [empresa], mercado };

    avanzarPeriodo(mundo);
    expect(economia.periodo).toBe(1);
    expect(economia.pibGlobal).toBeGreaterThan(0);
    expect(economia.historico).toHaveLength(1);
    expect(mercado.cotizaciones[0]?.precio).toBeGreaterThan(0);
  });

  test("el sistema sigue sano tras 60 períodos (no colapsa)", () => {
    const economia = new Economia([
      new Recurso("Agua", "agua", "m3", { disponibilidad: 1, regeneracion: 0.02, consumoBase: 1 }),
      new Recurso("Luz", "electricidad", "kWh", {
        disponibilidad: 1,
        regeneracion: 0.03,
        consumoBase: 1.2,
      }),
    ]);
    const empresas = [
      new Empresa("Demo", 1, [], 5_000_000, [], { productividad: 1 }),
      new Empresa("Tech", 2, [], 3_000_000, [], { productividad: 1.4, intensidadEmision: 0.3 }),
    ];
    const mercado = new Mercado();
    for (const empresa of empresas) mercado.listarEmpresa(empresa, 100, 1000);
    const mundo = { economia, empresas, mercado };

    avanzarPeriodos(mundo, 60);

    expect(economia.periodo).toBe(60);
    expect(economia.pibGlobal).toBeGreaterThan(0);
    expect(economia.productividadGlobal).toBeGreaterThan(0);
    expect(economia.productividadGlobal).toBeLessThanOrEqual(2);
    expect(economia.ambiente.contaminacion).toBeLessThanOrEqual(1);
    for (const recurso of economia.recursos) {
      expect(recurso.disponibilidad).toBeGreaterThanOrEqual(0);
      expect(recurso.disponibilidad).toBeLessThanOrEqual(2);
    }
    for (const empresa of empresas) {
      expect(empresa.productividad).toBeGreaterThan(0);
      expect(empresa.productividad).toBeLessThanOrEqual(2);
    }
  });
});

describe("productividad global en los sueldos", () => {
  test("escala todos los sueldos", () => {
    const empleado = new EmpleadoFijo(
      "Ana",
      1,
      new Empresa("E", 1, [], 0, [], { nacion: nacionNueva() }),
    );
    expect(empleado.sueldoConLeyes([], 1.2).monto).toBe(60000);
    expect(empleado.sueldoConLeyes([], 0.5).monto).toBe(25000);
  });

  test("Sueldo.escalar multiplica el monto", () => {
    expect(new Sueldo(100, false, "fijo").escalar(1.5).monto).toBe(150);
  });
});
