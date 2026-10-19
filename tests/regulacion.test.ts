import { describe, expect, test } from "bun:test";

import Estado from "../src/domain/Estado";
import LeyTecnologica from "../src/domain/LeyTecnologica";
import type { OpcionesLeyTecnologica } from "../src/domain/LeyTecnologica";
import Nacion from "../src/domain/Nacion";
import type { VectorValores } from "../src/domain/contratosTecnologia";
import { valoresNulos } from "../src/domain/contratosTecnologia";
import {
  costoDeMudanza,
  estaPermitida,
  evaluarMudanza,
  jurisdiccionDe,
  parametrosDePatente,
  regulacionDe,
  topeDeNivel,
  type Jurisdiccion,
  type PropuestaMudanza,
} from "../src/services/regulacion";

// Mundo de prueba: dos naciones y dos estados en la primera.
const alfa = new Nacion("Alfa", "Ciudad A", "es", 1_000_000);
const beta = new Nacion("Beta", "Ciudad B", "es", 100_000);
const alfaNorte = new Estado("Norte", "Capital N", "es", 300_000, alfa);
const alfaSur = new Estado("Sur", "Capital S", "es", 700_000, alfa);

function ley(
  nombre: string,
  ubicacion: Nacion | Estado,
  opciones: OpcionesLeyTecnologica,
): LeyTecnologica {
  return new LeyTecnologica(nombre, `${nombre} de prueba`, ubicacion, {
    activa: true,
    ...opciones,
  });
}

function propuestaBase(overrides: Partial<PropuestaMudanza> = {}): PropuestaMudanza {
  return {
    origen: jurisdiccionDe(alfa),
    destino: jurisdiccionDe(beta),
    campo: "procesamiento",
    nivel: 5,
    beneficioPorPeriodo: 0,
    horizonte: 10,
    nivelBurocracia: 0,
    ingresosPorPeriodo: 0,
    emisionPorPeriodo: 0,
    ...overrides,
  };
}

describe("LeyTecnologica", () => {
  test("cubre el rango de niveles de forma inclusiva", () => {
    const rango = ley("Rango", alfa, {
      campo: "energia",
      nivelDesde: 2,
      nivelHasta: 4,
      regulacion: "prohibida",
    });
    expect(rango.cubreNivel(1)).toBe(false);
    expect(rango.cubreNivel(2)).toBe(true);
    expect(rango.cubreNivel(4)).toBe(true);
    expect(rango.cubreNivel(5)).toBe(false);
  });

  test("una ley estatal solo aplica a su estado", () => {
    const estatal = ley("Estatal", alfaNorte, { campo: "energia", regulacion: "prohibida" });
    expect(estatal.alcance).toBe("estado");
    expect(estatal.aplicaEn(alfa, alfaNorte)).toBe(true);
    expect(estatal.aplicaEn(alfa, alfaSur)).toBe(false);
    expect(estatal.aplicaEn(alfa)).toBe(false);
  });

  test("una ley global aplica en cualquier lugar", () => {
    const global = ley("Global", alfa, {
      campo: "energia",
      regulacion: "prohibida",
      alcance: "global",
    });
    expect(global.aplicaEn(beta)).toBe(true);
    expect(global.aplicaEn(alfa, alfaSur)).toBe(true);
  });

  test("una ley estatal necesita un Estado como ubicación", () => {
    expect(() => ley("Mal", beta, { campo: "energia", alcance: "estado" })).toThrow();
  });

  test("un tope sin topeNivel no se puede construir", () => {
    expect(() => ley("Tope", alfa, { campo: "energia", regulacion: "tope" })).toThrow();
  });
});

describe("regulacionDe", () => {
  test("sin leyes, el campo está libre", () => {
    const resultado = regulacionDe("energia", 3, jurisdiccionDe(alfa), []);
    expect(resultado).toEqual({ estado: "libre", origen: null, ley: null });
  });

  test("el estado tiene prioridad sobre la nación, incluso si es más laxo", () => {
    const nacional = ley("Nacional", alfa, { campo: "procesamiento", regulacion: "prohibida" });
    const estatal = ley("Estatal", alfaNorte, { campo: "procesamiento", regulacion: "permiso" });
    const resultado = regulacionDe("procesamiento", 5, jurisdiccionDe(alfaNorte), [
      nacional,
      estatal,
    ]);
    expect(resultado.estado).toBe("permiso");
    expect(resultado.origen).toBe("estado");
  });

  test("sin ley estatal, en el estado manda la nación", () => {
    const nacional = ley("Nacional", alfa, { campo: "procesamiento", regulacion: "prohibida" });
    const resultado = regulacionDe("procesamiento", 5, jurisdiccionDe(alfaSur), [nacional]);
    expect(resultado.estado).toBe("prohibida");
    expect(resultado.origen).toBe("nacion");
  });

  test("una prohibición estatal aplica aunque la nación permita", () => {
    const nacional = ley("Nacional", alfa, { campo: "procesamiento", regulacion: "permiso" });
    const estatal = ley("Estatal", alfaNorte, { campo: "procesamiento", regulacion: "prohibida" });
    const resultado = regulacionDe("procesamiento", 5, jurisdiccionDe(alfaNorte), [
      nacional,
      estatal,
    ]);
    expect(resultado.estado).toBe("prohibida");
  });

  test("el piso global no se evade: una ley estatal laxa no lo levanta", () => {
    const global = ley("Global", alfa, {
      campo: "energia",
      nivelDesde: 5,
      regulacion: "prohibida",
      alcance: "global",
    });
    const estatal = ley("Estatal", alfaNorte, { campo: "energia", regulacion: "permiso" });
    const resultado = regulacionDe("energia", 6, jurisdiccionDe(alfaNorte), [global, estatal]);
    expect(resultado.estado).toBe("prohibida");
    expect(resultado.origen).toBe("global");
  });

  test("una ley global más laxa que la local no reduce la restricción local", () => {
    const global = ley("Global", alfa, {
      campo: "energia",
      regulacion: "permiso",
      alcance: "global",
    });
    const nacional = ley("Nacional", alfa, { campo: "energia", regulacion: "prohibida" });
    const resultado = regulacionDe("energia", 1, jurisdiccionDe(beta), [global, nacional]);
    expect(resultado.estado).toBe("permiso");
    expect(resultado.origen).toBe("global");
  });

  test("ignora leyes inactivas y de otro campo o nivel", () => {
    const inactiva = ley("Inactiva", alfa, { campo: "energia", regulacion: "prohibida" });
    inactiva.desactivar();
    const otroCampo = ley("Otro campo", alfa, { campo: "burocracia", regulacion: "prohibida" });
    const otroNivel = ley("Otro nivel", alfa, {
      campo: "energia",
      nivelDesde: 10,
      regulacion: "prohibida",
    });
    const resultado = regulacionDe("energia", 3, jurisdiccionDe(alfa), [
      inactiva,
      otroCampo,
      otroNivel,
    ]);
    expect(resultado.estado).toBe("libre");
  });
});

describe("estaPermitida y topeDeNivel", () => {
  test("prohibida nunca se permite", () => {
    const leyes = [ley("P", alfa, { campo: "energia", regulacion: "prohibida" })];
    expect(estaPermitida("energia", 0, jurisdiccionDe(alfa), leyes, true)).toBe(false);
  });

  test("permiso se permite solo con permiso", () => {
    const leyes = [ley("Permiso", alfa, { campo: "energia", regulacion: "permiso" })];
    expect(estaPermitida("energia", 0, jurisdiccionDe(alfa), leyes)).toBe(false);
    expect(estaPermitida("energia", 0, jurisdiccionDe(alfa), leyes, true)).toBe(true);
  });

  test("tope permite hasta el nivel indicado y prohíbe por encima", () => {
    const leyes = [ley("Tope", alfa, { campo: "procesamiento", regulacion: "tope", topeNivel: 3 })];
    const jurisdiccion = jurisdiccionDe(alfa);
    expect(estaPermitida("procesamiento", 3, jurisdiccion, leyes)).toBe(true);
    expect(estaPermitida("procesamiento", 4, jurisdiccion, leyes)).toBe(false);
    expect(topeDeNivel("procesamiento", jurisdiccion, leyes)).toBe(3);
  });

  test("sin leyes el tope es infinito", () => {
    expect(topeDeNivel("energia", jurisdiccionDe(alfa), [])).toBe(Number.POSITIVE_INFINITY);
  });

  test("con la prohibición en el nivel 0 el tope es -1", () => {
    const leyes = [ley("Todo", alfa, { campo: "energia", regulacion: "prohibida" })];
    expect(topeDeNivel("energia", jurisdiccionDe(alfa), leyes)).toBe(-1);
  });
});

describe("parametrosDePatente", () => {
  test("sin leyes toma los valores por defecto", () => {
    expect(parametrosDePatente(jurisdiccionDe(alfa), [])).toEqual({
      plazoMaximo: 20,
      renovarCada: 5,
      tarifa: 100,
    });
  });

  test("cada parámetro sale de la ley más específica que lo fija", () => {
    const global = ley("Global", alfa, {
      campo: "energia",
      alcance: "global",
      patente: { plazoMaximo: 30, tarifa: 500 },
    });
    const nacional = ley("Nacional", alfa, { campo: "energia", patente: { plazoMaximo: 15 } });
    const estatal = ley("Estatal", alfaNorte, { campo: "energia", patente: { renovarCada: 2 } });

    const parametros = parametrosDePatente(jurisdiccionDe(alfaNorte), [global, nacional, estatal]);
    expect(parametros).toEqual({ plazoMaximo: 15, renovarCada: 2, tarifa: 500 });
  });

  test("en otra jurisdicción no se aplica la ley estatal", () => {
    const estatal = ley("Estatal", alfaNorte, { campo: "energia", patente: { renovarCada: 2 } });
    expect(parametrosDePatente(jurisdiccionDe(alfaSur), [estatal]).renovarCada).toBe(5);
  });
});

describe("costoDeMudanza", () => {
  test("cambiar de jurisdicción a la misma cuesta cero", () => {
    expect(costoDeMudanza(jurisdiccionDe(alfa), jurisdiccionDe(alfa), 0)).toBe(0);
  });

  test("entre naciones cuesta más que entre estados", () => {
    const entreEstados = costoDeMudanza(jurisdiccionDe(alfaNorte), jurisdiccionDe(alfaSur), 0);
    const entreNaciones = costoDeMudanza(jurisdiccionDe(alfa), jurisdiccionDe(beta), 0);
    expect(entreEstados).toBeGreaterThan(0);
    expect(entreNaciones).toBeGreaterThan(entreEstados);
  });

  test("el costo baja con el nivel de burocracia", () => {
    const origen = jurisdiccionDe(alfa);
    const destino = jurisdiccionDe(beta);
    const [sinBurocracia, ...conBurocracia] = [0, 1, 3, 5, 10].map((nivel) =>
      costoDeMudanza(origen, destino, nivel),
    );
    let anterior = sinBurocracia ?? Number.POSITIVE_INFINITY;
    expect(anterior).toBe(250_000);
    for (const costo of conBurocracia) {
      expect(costo).toBeLessThan(anterior);
      anterior = costo;
    }
    expect(anterior).toBeGreaterThan(0);
  });
});

describe("evaluarMudanza", () => {
  const laxa = [
    ley("Prohibición en Alfa", alfa, { campo: "procesamiento", regulacion: "prohibida" }),
  ];

  test("sin norma que evadir no hay beneficio", () => {
    const decision = evaluarMudanza(propuestaBase({ beneficioPorPeriodo: 1_000_000 }), []);
    expect(decision.conviene).toBe(false);
    expect(decision.motivo).toBe("sin-norma-que-evadir");
    expect(decision.desglose.beneficio).toBe(0);
  });

  test("un caso donde NO conviene mudarse: el costo supera el beneficio", () => {
    // Beneficio 10 × 1000 = 10.000 contra un costo de mudanza de 250.000 sin burocracia.
    const decision = evaluarMudanza(propuestaBase({ beneficioPorPeriodo: 1_000 }), laxa);
    expect(decision.desglose.evadeNorma).toBe(true);
    expect(decision.conviene).toBe(false);
    expect(decision.motivo).toBe("costos-superan-beneficio");
  });

  test("con burocracia alta sí conviene si el beneficio es grande", () => {
    const decision = evaluarMudanza(
      propuestaBase({ beneficioPorPeriodo: 100_000, nivelBurocracia: 10 }),
      laxa,
    );
    expect(decision.conviene).toBe(true);
    expect(decision.motivo).toBe("conviene");
  });

  test("la pérdida de clientes pesa cuando el destino tiene menos población", () => {
    const sinPerdida = evaluarMudanza(
      propuestaBase({ beneficioPorPeriodo: 100_000, nivelBurocracia: 10, ingresosPorPeriodo: 0 }),
      laxa,
    );
    const conPerdida = evaluarMudanza(
      propuestaBase({
        beneficioPorPeriodo: 100_000,
        nivelBurocracia: 10,
        ingresosPorPeriodo: 50_000,
      }),
      laxa,
    );
    expect(sinPerdida.desglose.perdidaClientes).toBe(0);
    expect(conPerdida.desglose.perdidaClientes).toBeGreaterThan(0);
    expect(conPerdida.desglose.balance).toBeLessThan(sinPerdida.desglose.balance);
  });

  test("los contrapesos impiden que mudarse al lugar más laxo sea siempre óptimo", () => {
    // Mismo beneficio y burocracia que el caso que conviene, pero con investigadores
    // de valores ecosistémicos que se irían de una empresa muy contaminante.
    const ecosistema: VectorValores = { ...valoresNulos(), ecosistema: 1 };
    const investigadores = Array.from({ length: 10 }, () => ({
      personalidad: ecosistema,
      sueldo: 10_000,
    }));
    const decision = evaluarMudanza(
      propuestaBase({
        beneficioPorPeriodo: 100_000,
        nivelBurocracia: 10,
        emisionPorPeriodo: 100,
        investigadores,
      }),
      laxa,
    );
    expect(decision.desglose.rechazoInvestigadores).toBeGreaterThan(decision.desglose.beneficio);
    expect(decision.conviene).toBe(false);
    expect(decision.motivo).toBe("costos-superan-beneficio");
  });

  test("el rechazo de investigadores requiere afinidad con el ecosistema", () => {
    const lucro: VectorValores = { ...valoresNulos(), lucro: 1 };
    const decision = evaluarMudanza(
      propuestaBase({
        beneficioPorPeriodo: 100_000,
        nivelBurocracia: 10,
        emisionPorPeriodo: 100,
        investigadores: [{ personalidad: lucro, sueldo: 10_000 }],
      }),
      laxa,
    );
    expect(decision.desglose.rechazoInvestigadores).toBe(0);
  });

  test("la externalidad se reporta pero no entra en el balance privado", () => {
    const sinEmision = evaluarMudanza(
      propuestaBase({ beneficioPorPeriodo: 100_000, nivelBurocracia: 10, emisionPorPeriodo: 0 }),
      laxa,
    );
    const conEmision = evaluarMudanza(
      propuestaBase({ beneficioPorPeriodo: 100_000, nivelBurocracia: 10, emisionPorPeriodo: 50 }),
      laxa,
    );
    expect(sinEmision.desglose.externalidad).toBe(0);
    expect(conEmision.desglose.externalidad).toBeGreaterThan(0);
    expect(conEmision.desglose.balance).toBe(sinEmision.desglose.balance);
  });

  test("el piso global bloquea la mudanza aunque el beneficio sea enorme", () => {
    const global = ley("Global", alfa, {
      campo: "procesamiento",
      regulacion: "prohibida",
      alcance: "global",
    });
    const decision = evaluarMudanza(
      propuestaBase({ beneficioPorPeriodo: 1_000_000_000, nivelBurocracia: 10 }),
      [...laxa, global],
    );
    expect(decision.desglose.bloqueadaPorPisoGlobal).toBe(true);
    expect(decision.conviene).toBe(false);
    expect(decision.motivo).toBe("piso-global");
  });

  test("el desglose es consistente con la decisión", () => {
    const casos: PropuestaMudanza[] = [
      propuestaBase({ beneficioPorPeriodo: 1_000 }),
      propuestaBase({
        beneficioPorPeriodo: 100_000,
        nivelBurocracia: 10,
        ingresosPorPeriodo: 5_000,
      }),
      propuestaBase({ beneficioPorPeriodo: 100_000, nivelBurocracia: 10, emisionPorPeriodo: 100 }),
    ];
    for (const propuesta of casos) {
      const { conviene, motivo, desglose } = evaluarMudanza(propuesta, laxa);
      const suma =
        desglose.costoMudanza + desglose.perdidaClientes + desglose.rechazoInvestigadores;
      expect(desglose.costoTotal).toBeCloseTo(suma);
      expect(desglose.balance).toBeCloseTo(desglose.beneficio - desglose.costoTotal);
      expect(conviene).toBe(desglose.balance > 0);
      if (conviene) expect(motivo).toBe("conviene");
      else expect(motivo).not.toBe("conviene");
    }
  });

  test("la regulación del destino y del origen se devuelven en el desglose", () => {
    const decision = evaluarMudanza(propuestaBase({ beneficioPorPeriodo: 1_000 }), laxa);
    expect(decision.desglose.regulacionOrigen.estado).toBe("prohibida");
    expect(decision.desglose.regulacionDestino.estado).toBe("libre");
  });
});

describe("jurisdiccionDe", () => {
  test("una nación no tiene estado; un estado lleva su nación", () => {
    const deNacion: Jurisdiccion = jurisdiccionDe(beta);
    expect(deNacion.estado).toBeUndefined();
    expect(jurisdiccionDe(alfaNorte)).toEqual({ nacion: alfa, estado: alfaNorte });
  });
});
