import { describe, expect, test } from "bun:test";

import { VALORES, valoresNulos } from "../src/domain/contratosTecnologia";
import type { VectorValores } from "../src/domain/contratosTecnologia";
import Investigador from "../src/domain/Investigador";
import { crearAleatorio } from "../src/services/aleatorio";
import {
  aporteDeInversion,
  costoDeCambio,
  decidirOferta,
  generarInvestigadorEspontaneo,
  ofertaEfectiva,
  PROBABILIDAD_APARICION,
  subastar,
  sueldoDeReserva,
} from "../src/services/investigadores";

/** Vector con un único valor en 1: afinidad 1 con quien comparte ese valor, 0 con el resto. */
function solo(valor: (typeof VALORES)[number]): VectorValores {
  return { ...valoresNulos(), [valor]: 1 };
}

function investigador(personalidad: VectorValores, empleador: string | null = null): Investigador {
  return new Investigador("Ana", "procesamiento", 0.5, personalidad, empleador);
}

describe("generarInvestigadorEspontaneo", () => {
  test("con la misma semilla produce el mismo investigador", () => {
    const a = generarInvestigadorEspontaneo(crearAleatorio(5), { probabilidad: 1 });
    const b = generarInvestigadorEspontaneo(crearAleatorio(5), { probabilidad: 1 });
    expect(a).not.toBeNull();
    expect(a).toEqual(b as Investigador);
  });

  test("la habilidad queda en el rango y el investigador es independiente", () => {
    const aleatorio = crearAleatorio(11);
    for (let i = 0; i < 200; i += 1) {
      const nuevo = generarInvestigadorEspontaneo(aleatorio, { probabilidad: 1 });
      expect(nuevo).not.toBeNull();
      expect(nuevo!.habilidad).toBeGreaterThanOrEqual(0.1);
      expect(nuevo!.habilidad).toBeLessThan(1);
      expect(nuevo!.esIndependiente()).toBe(true);
    }
  });

  test("la aparición espontánea ocurre con la tasa esperada en miles de ciclos", () => {
    const aleatorio = crearAleatorio(2024);
    const ciclos = 200_000;
    let apariciones = 0;
    for (let i = 0; i < ciclos; i += 1) {
      if (generarInvestigadorEspontaneo(aleatorio) !== null) apariciones += 1;
    }
    const esperado = ciclos * PROBABILIDAD_APARICION;
    // Binomial: desvío ~ sqrt(n p (1-p)) ~ 20; tolerancia de 5 desvíos.
    expect(Math.abs(apariciones - esperado)).toBeLessThan(5 * Math.sqrt(esperado));
  });

  test("la aparición espontánea es más rara que el descubrimiento por inversión", () => {
    // Umbral de referencia de la épica I: el descubrimiento por inversión debe ser más probable.
    expect(PROBABILIDAD_APARICION).toBeLessThan(0.05);
  });
});

describe("aporteDeInversion", () => {
  test("es monótono: sumar un investigador nunca baja el aporte", () => {
    const aleatorio = crearAleatorio(3);
    const equipo: Investigador[] = [];
    let previo = 0;
    for (let i = 0; i < 20; i += 1) {
      const nuevo = generarInvestigadorEspontaneo(aleatorio, { probabilidad: 1 })!;
      equipo.push(nuevo);
      const aporte = aporteDeInversion(equipo);
      expect(aporte).toBeGreaterThanOrEqual(previo);
      previo = aporte;
    }
  });

  test("es la suma de habilidades y filtra por campo si se indica", () => {
    const a = new Investigador("A", "energia", 0.4, valoresNulos());
    const b = new Investigador("B", "procesamiento", 0.7, valoresNulos());
    expect(aporteDeInversion([a, b])).toBeCloseTo(1.1);
    expect(aporteDeInversion([a, b], "energia")).toBeCloseTo(0.4);
    expect(aporteDeInversion([])).toBe(0);
  });
});

describe("ofertaEfectiva y afinidad", () => {
  test("con la misma plata, la personalidad alineada con la empresa gana", () => {
    const empresa = solo("ecosistema");
    const alineado = ofertaEfectiva(100_000, solo("ecosistema"), empresa);
    const opuesto = ofertaEfectiva(100_000, solo("lucro"), empresa);
    expect(alineado).toBeGreaterThan(opuesto);
    expect(opuesto).toBe(100_000);
  });

  test("la afinidad cambia al ganador de la subasta (misma plata, distinta personalidad)", () => {
    const ofertas = [
      { empresa: "Eco", sueldoOfrecido: 100_000, valoresEmpresa: solo("ecosistema") },
      { empresa: "Militar", sueldoOfrecido: 100_000, valoresEmpresa: solo("militar") },
    ];
    const ecologista = investigador(solo("ecosistema"));
    const belicista = investigador(solo("militar"));
    expect(subastar(ecologista, ofertas, 1).ganador).toBe("Eco");
    expect(subastar(belicista, ofertas, 1).ganador).toBe("Militar");
  });
});

describe("subastar", () => {
  const personalidad = solo("lucro");
  const sinAfinidad = { ...valoresNulos() };

  test("nadie gana si ninguna oferta supera la reserva", () => {
    const ana = investigador(personalidad);
    const reserva = sueldoDeReserva(ana);
    const ofertas = [
      { empresa: "X", sueldoOfrecido: reserva * 0.5, valoresEmpresa: sinAfinidad },
      { empresa: "Y", sueldoOfrecido: reserva * 0.9, valoresEmpresa: sinAfinidad },
    ];
    expect(subastar(ana, ofertas)).toEqual({ ganador: null, precio: 0, ofertaEfectiva: 0 });
  });

  test("gana la oferta efectiva más alta por encima del umbral, y devuelve su precio", () => {
    const ana = investigador(personalidad);
    const ofertas = [
      { empresa: "Baja", sueldoOfrecido: 120_000, valoresEmpresa: sinAfinidad },
      { empresa: "Alta", sueldoOfrecido: 200_000, valoresEmpresa: sinAfinidad },
    ];
    const resultado = subastar(ana, ofertas);
    expect(resultado.ganador).toBe("Alta");
    expect(resultado.precio).toBe(200_000);
  });

  test("el costo de cambio protege al empleador actual", () => {
    const ana = investigador(personalidad, "Actual");
    const costo = costoDeCambio(ana);
    expect(costo).toBeGreaterThan(0);
    // Un rival que ofrece justo sobre la reserva no alcanza: tiene que superar el costo de cambio.
    const justoSobreReserva = sueldoDeReserva(ana) * 1.01;
    const rival = [
      { empresa: "Rival", sueldoOfrecido: justoSobreReserva, valoresEmpresa: sinAfinidad },
    ];
    expect(subastar(ana, rival).ganador).toBeNull();
    // El empleador actual con la misma oferta sí cumple el umbral (compite en igualdad).
    const actual = [
      { empresa: "Actual", sueldoOfrecido: justoSobreReserva, valoresEmpresa: sinAfinidad },
    ];
    expect(subastar(ana, actual).ganador).toBe("Actual");
  });

  test("un independiente no tiene costo de cambio", () => {
    expect(costoDeCambio(investigador(personalidad))).toBe(0);
  });

  test("ignora ofertas no válidas", () => {
    const ana = investigador(personalidad);
    const ofertas = [
      { empresa: "Nula", sueldoOfrecido: 0, valoresEmpresa: sinAfinidad },
      { empresa: "Nan", sueldoOfrecido: Number.NaN, valoresEmpresa: sinAfinidad },
    ];
    expect(subastar(ana, ofertas).ganador).toBeNull();
  });
});

describe("decidirOferta (provisoria)", () => {
  test("ofrece lo justo para superar al mejor rival y devuelve null si el presupuesto no alcanza", () => {
    const ana = investigador(solo("lucro"));
    const valoresEmpresa = valoresNulos();
    const oferta = decidirOferta({
      investigador: ana,
      empresa: "Mia",
      valoresEmpresa,
      presupuesto: 1_000_000,
      mejorRival: 150_000,
      beta: 1,
    });
    expect(oferta).not.toBeNull();
    expect(ofertaEfectiva(oferta!, ana.personalidad, valoresEmpresa, 1)).toBeGreaterThan(150_000);

    const sinPlata = decidirOferta({
      investigador: ana,
      empresa: "Mia",
      valoresEmpresa,
      presupuesto: 1,
      mejorRival: 150_000,
    });
    expect(sinPlata).toBeNull();
  });
});
