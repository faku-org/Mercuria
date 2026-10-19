import { describe, expect, test } from "bun:test";

import Ambiente, {
  ABSORCION_STOCK,
  AIRE_DE_REFERENCIA,
  EMISION_DE_REFERENCIA,
  PERSISTENCIA_AIRE,
} from "../src/domain/Ambiente";
import Economia from "../src/domain/Economia";
import Empresa from "../src/domain/Empresa";
import Mercado from "../src/domain/Mercado";
import Recurso, { type TipoRecurso } from "../src/domain/Recurso";
import { clonarMundo, predecir } from "../src/services/prediccion";
import { avanzarPeriodo, avanzarPeriodos } from "../src/services/simulacion";

/** Mundo con la misma semilla que `fixtures/` (recursos, ambiente y tres empresas). */
function mundoSemilla() {
  const recursos = (
    [
      ["Agua", "agua", "m3", 1, 0.02, 1, 0.5],
      ["Electricidad", "electricidad", "kWh", 1, 0.03, 1.2, 0.9],
      ["Combustible", "combustible", "L", 0.8, 0.01, 1.5, 1.4],
      ["Minerales", "minerales", "kg", 0.6, 0.005, 0.8, 2.5],
    ] as const
  ).map(
    ([nombre, tipo, unidad, disponibilidad, regeneracion, consumoBase, precioBase]) =>
      new Recurso(nombre, tipo as TipoRecurso, unidad, {
        disponibilidad,
        regeneracion,
        consumoBase,
        precioBase,
      }),
  );
  const economia = new Economia(recursos, new Ambiente(0.12, 0, 0.88));
  const mercado = new Mercado();
  const empresas = (
    [
      ["Empresa Demo", 5_000_000, 1, 0.5, 50_000, 120],
      ["Nova Labs", 3_000_000, 1.4, 0.3, 30_000, 100],
      ["Acero del Sur", 8_000_000, 0.85, 0.9, 80_000, 90],
    ] as const
  ).map(([nombre, capital, productividad, intensidadEmision, acciones, precio], indice) => {
    const empresa = new Empresa(nombre, indice + 1, [], capital, [], {
      productividad,
      capacidad: productividad,
      acciones,
      intensidadEmision,
    });
    mercado.listarEmpresa(empresa, precio, acciones);
    return empresa;
  });
  return { economia, empresas, mercado };
}

describe("ambiente: flujo y absorción", () => {
  test("las emisiones suben el stock y el aire, y arrastran temperatura y biodiversidad", () => {
    const ambiente = new Ambiente(0.1, 0, 0.9);
    ambiente.registrarEmision(0.001);
    expect(ambiente.contaminacion).toBeCloseTo(0.101, 6);
    expect(ambiente.calidadAire).toBeLessThan(0.9);
    expect(ambiente.temperatura).toBeCloseTo(0.202, 4);
    expect(ambiente.biodiversidad).toBeCloseTo(0.9 * (1 - 0.101), 3);
  });

  test("regenerar absorbe el stock y no toca el aire", () => {
    const ambiente = new Ambiente(0.2, 0, 0.72, 0.8);
    ambiente.regenerar();
    expect(ambiente.contaminacion).toBeCloseTo(0.2 * (1 - ABSORCION_STOCK), 6);
    expect(ambiente.calidadAire).toBe(0.8);
    expect(ambiente.temperatura).toBeCloseTo(ambiente.contaminacion * 2, 4);
  });

  test("sin emisiones el aire se recupera rápido y el stock apenas se mueve", () => {
    const ambiente = new Ambiente(0.2, 0, 0.72, 0.8);
    for (let i = 0; i < 10; i += 1) {
      ambiente.registrarEmision(0);
      ambiente.regenerar();
    }
    // La contaminación del aire cae por la persistencia: 0,2 × 0,6^10 ≈ 0,0012.
    expect(ambiente.calidadAire).toBeGreaterThan(0.99);
    // El stock solo perdió la absorción: 10 períodos × 0,5%.
    expect(ambiente.contaminacion).toBeGreaterThan(0.2 * (1 - ABSORCION_STOCK) ** 10 - 1e-6);
    expect(ambiente.contaminacion).toBeGreaterThan(0.19);
  });

  test("con la emisión de referencia sostenida, el aire queda en el nivel de la semilla", () => {
    const ambiente = new Ambiente(0.12, 0, 0.88);
    for (let i = 0; i < 40; i += 1) ambiente.registrarEmision(EMISION_DE_REFERENCIA);
    expect(1 - ambiente.calidadAire).toBeCloseTo(AIRE_DE_REFERENCIA, 2);
    // Y la persistencia es la que dice la calibración.
    expect(PERSISTENCIA_AIRE).toBeGreaterThan(0);
    expect(PERSISTENCIA_AIRE).toBeLessThan(1);
  });

  test("el impacto usa el aire como estado propio", () => {
    const limpio = new Ambiente(0.2, 0, 0.72, 1);
    const sucio = new Ambiente(0.2, 0, 0.72, 0.5);
    expect(sucio.impacto()).toBeGreaterThan(limpio.impacto());
  });

  test("sin pasar calidadAire, arranca en equilibrio con el stock", () => {
    expect(new Ambiente(0.12, 0, 0.88).calidadAire).toBeCloseTo(0.88, 4);
  });
});

describe("ambiente en el ciclo de simulación", () => {
  test("con la semilla, el aire arranca en el nivel de referencia", () => {
    const mundo = mundoSemilla();
    avanzarPeriodo(mundo);
    expect(1 - mundo.economia.ambiente.calidadAire).toBeCloseTo(AIRE_DE_REFERENCIA, 2);
  });

  test("si la emisión es menor que la absorción, el stock baja", () => {
    const mundo = mundoSemilla();
    mundo.economia.ambiente.contaminacion = 0.3;
    // Casi sin producción: la emisión es mucho menor que la absorción del 0,5% de 0,3.
    for (const empresa of mundo.empresas) empresa.capital = 1_000;
    let anterior = mundo.economia.ambiente.contaminacion;
    for (let i = 0; i < 20; i += 1) {
      avanzarPeriodo(mundo);
      const actual = mundo.economia.ambiente.contaminacion;
      expect(actual).toBeLessThan(anterior);
      anterior = actual;
    }
  });

  test("efecto pandemia: si cae la producción el aire mejora rápido y el stock casi no se mueve", () => {
    const mundo = mundoSemilla();
    avanzarPeriodos(mundo, 40);
    const aireAntes = 1 - mundo.economia.ambiente.calidadAire;
    const stockAntes = mundo.economia.ambiente.contaminacion;

    for (const empresa of mundo.empresas) empresa.capital *= 0.2;
    avanzarPeriodos(mundo, 10);

    const aireDespues = 1 - mundo.economia.ambiente.calidadAire;
    const stockDespues = mundo.economia.ambiente.contaminacion;
    const mejoraAire = (aireAntes - aireDespues) / aireAntes;
    const mejoraStock = (stockAntes - stockDespues) / stockAntes;

    expect(mejoraAire).toBeGreaterThan(0.25);
    expect(mejoraStock).toBeLessThan(0.1);
    expect(mejoraAire).toBeGreaterThan(mejoraStock * 5);
  });

  test("al reactivarse la producción el aire vuelve a empeorar", () => {
    const mundo = mundoSemilla();
    avanzarPeriodos(mundo, 20);
    for (const empresa of mundo.empresas) empresa.capital *= 0.2;
    avanzarPeriodos(mundo, 10);
    const aireEnPausa = 1 - mundo.economia.ambiente.calidadAire;
    for (const empresa of mundo.empresas) empresa.capital *= 5;
    avanzarPeriodos(mundo, 10);
    expect(1 - mundo.economia.ambiente.calidadAire).toBeGreaterThan(aireEnPausa);
  });

  test("estabilidad: 300 períodos sin colapso y con el ambiente acotado", () => {
    const mundo = mundoSemilla();
    for (let i = 0; i < 300; i += 1) {
      avanzarPeriodo(mundo);
      const ambiente = mundo.economia.ambiente;
      expect(ambiente.contaminacion).toBeGreaterThanOrEqual(0);
      expect(ambiente.contaminacion).toBeLessThan(0.5);
      expect(ambiente.calidadAire).toBeGreaterThanOrEqual(0);
      expect(ambiente.calidadAire).toBeLessThanOrEqual(1);
      expect(ambiente.impacto()).toBeLessThanOrEqual(0.9);
    }
    expect(mundo.economia.pibGlobal).toBeGreaterThan(0);
  });

  test("la contaminación ya no solo acumula: con la semilla llega a un máximo y baja", () => {
    const mundo = mundoSemilla();
    let maximo = 0;
    let periodoMaximo = 0;
    for (let i = 1; i <= 300; i += 1) {
      avanzarPeriodo(mundo);
      if (mundo.economia.ambiente.contaminacion > maximo) {
        maximo = mundo.economia.ambiente.contaminacion;
        periodoMaximo = i;
      }
    }
    expect(periodoMaximo).toBeLessThan(300);
    expect(mundo.economia.ambiente.contaminacion).toBeLessThan(maximo);
  });
});

describe("la predicción conserva el estado del aire", () => {
  test("clonar copia calidadAire aunque no sea 1 − contaminación", () => {
    const mundo = mundoSemilla();
    mundo.economia.ambiente.calidadAire = 0.7;
    const copia = clonarMundo(mundo);
    expect(copia.economia.ambiente.calidadAire).toBe(0.7);
    expect(copia.economia.ambiente.contaminacion).toBe(mundo.economia.ambiente.contaminacion);
  });

  test("predecir un período coincide con avanzar uno de verdad y no toca el ambiente real", () => {
    const mundo = mundoSemilla();
    avanzarPeriodos(mundo, 15);
    mundo.economia.ambiente.calidadAire = 0.85;
    const antes = { ...mundo.economia.ambiente };

    const proyectado = predecir(mundo, 1);
    expect({ ...mundo.economia.ambiente }).toEqual(antes);

    avanzarPeriodo(mundo);
    expect(proyectado[0]?.pib).toBeCloseTo(mundo.economia.pibGlobal, 2);
    expect(proyectado[0]?.contaminacion).toBeCloseTo(mundo.economia.ambiente.contaminacion, 4);
  });
});
