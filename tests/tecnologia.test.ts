import { describe, expect, test } from "bun:test";

import { CAMPOS_TECNOLOGICOS, type CampoTecnologico } from "../src/domain/contratosTecnologia";
import Patente from "../src/domain/Patente";
import Tecnologia from "../src/domain/Tecnologia";
import { crearAleatorio } from "../src/services/aleatorio";
import {
  NIVEL_MAXIMO,
  costoDeNivel,
  demandaEnergeticaProcesamiento,
  efectoDeNivel,
  factorCostoProcesamiento,
  intentarDescubrir,
  inversionEfectiva,
  probabilidadDescubrimiento,
  progresoNatural,
  type NivelesPorCampo,
} from "../src/services/tecnologia";

const NIVELES_CERO: NivelesPorCampo = { energia: 0, procesamiento: 0, burocracia: 0 };

/** Simula un ciclo de la empresa: intenta descubrir en un campo y aplica progreso natural. */
function cicloEmpresa(
  niveles: NivelesPorCampo,
  campo: CampoTecnologico,
  inversion: number,
  aleatorio: ReturnType<typeof crearAleatorio>,
): void {
  if (intentarDescubrir(inversion, campo, niveles, aleatorio).descubierto) niveles[campo] += 1;
  for (const otro of CAMPOS_TECNOLOGICOS) {
    if (progresoNatural(niveles[otro], aleatorio)) niveles[otro] += 1;
  }
}

describe("costos", () => {
  test("el costo de cada nivel es mayor que el anterior, para todo campo", () => {
    for (const campo of CAMPOS_TECNOLOGICOS) {
      for (let n = 1; n < 12; n += 1) {
        expect(costoDeNivel(campo, n + 1)).toBeGreaterThan(costoDeNivel(campo, n));
      }
    }
  });

  test("el costo crece geométricamente (razón constante)", () => {
    const razon = costoDeNivel("energia", 3) / costoDeNivel("energia", 2);
    expect(razon).toBeCloseTo(1.6, 10);
    expect(costoDeNivel("energia", 5) / costoDeNivel("energia", 4)).toBeCloseTo(razon, 10);
  });

  test("niveles negativos o no enteros fallan", () => {
    expect(() => costoDeNivel("energia", -1)).toThrow(RangeError);
    expect(() => efectoDeNivel("energia", 1.5)).toThrow(RangeError);
  });
});

describe("efecto", () => {
  test("arranca en 0 y está siempre en [0, 1)", () => {
    for (const campo of CAMPOS_TECNOLOGICOS) {
      expect(efectoDeNivel(campo, 0)).toBe(0);
      for (let n = 0; n < 100; n += 1) {
        const e = efectoDeNivel(campo, n);
        expect(e).toBeGreaterThanOrEqual(0);
        expect(e).toBeLessThan(1);
      }
    }
  });

  test("satura: cada nivel nuevo aporta menos que el anterior", () => {
    for (const campo of CAMPOS_TECNOLOGICOS) {
      let previo = efectoDeNivel(campo, 0);
      let aportePrevio = Infinity;
      for (let n = 1; n < 30; n += 1) {
        const actual = efectoDeNivel(campo, n);
        const aporte = actual - previo;
        expect(aporte).toBeLessThan(aportePrevio);
        aportePrevio = aporte;
        previo = actual;
      }
      expect(efectoDeNivel(campo, 200)).toBeCloseTo(1, 6);
    }
  });
});

describe("probabilidad de descubrimiento", () => {
  test("está en [0, 1] para inversiones de distinta magnitud", () => {
    for (const inversion of [0, 1, 50, 1_000, 1_000_000]) {
      for (const campo of CAMPOS_TECNOLOGICOS) {
        for (let n = 0; n < 15; n += 1) {
          const p = probabilidadDescubrimiento(inversion, campo, n);
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test("es creciente con la inversión", () => {
    let previa = -1;
    for (const inversion of [0, 10, 50, 100, 500, 1_000]) {
      const p = probabilidadDescubrimiento(inversion, "procesamiento", 2);
      expect(p).toBeGreaterThan(previa);
      previa = p;
    }
  });

  test("es decreciente con el nivel actual (subir cuesta más)", () => {
    let previa = Infinity;
    for (let n = 0; n < 10; n += 1) {
      const p = probabilidadDescubrimiento(200, "energia", n);
      expect(p).toBeLessThan(previa);
      previa = p;
    }
  });

  test("inversión cero: probabilidad cero", () => {
    expect(probabilidadDescubrimiento(0, "energia", 0)).toBe(0);
  });
});

describe("interacciones entre campos", () => {
  test("energía alta abarata el procesamiento, pero el descuento tiene tope", () => {
    expect(factorCostoProcesamiento(0)).toBe(1);
    let previo = 1;
    for (let n = 1; n < 40; n += 1) {
      const f = factorCostoProcesamiento(n);
      expect(f).toBeLessThanOrEqual(previo);
      previo = f;
    }
    expect(factorCostoProcesamiento(500)).toBeGreaterThan(0.69);
  });

  test("con energía alta, la misma inversión rinde más en procesamiento", () => {
    const conEnergiaBaja = inversionEfectiva("procesamiento", 100, { ...NIVELES_CERO, energia: 0 });
    const conEnergiaAlta = inversionEfectiva("procesamiento", 100, {
      ...NIVELES_CERO,
      energia: 10,
    });
    expect(conEnergiaAlta).toBeGreaterThan(conEnergiaBaja);
  });

  test("el procesamiento alto exige más energía, pero el rebote está amortiguado", () => {
    expect(demandaEnergeticaProcesamiento(0)).toBe(1);
    let previo = 1;
    for (let n = 1; n < 40; n += 1) {
      const d = demandaEnergeticaProcesamiento(n);
      expect(d).toBeGreaterThanOrEqual(previo);
      previo = d;
    }
    expect(demandaEnergeticaProcesamiento(500)).toBeLessThan(1.2);
  });
});

describe("descubrimiento y progreso natural", () => {
  test("intentarDescubrir es reproducible con la misma semilla", () => {
    const correr = (semilla: number): boolean[] => {
      const a = crearAleatorio(semilla);
      const niveles = { ...NIVELES_CERO };
      const resultados: boolean[] = [];
      for (let i = 0; i < 100; i += 1) {
        resultados.push(intentarDescubrir(80, "procesamiento", niveles, a).descubierto);
      }
      return resultados;
    };
    expect(correr(99)).toEqual(correr(99));
  });

  test("consume siempre un valor de azar, descubra o no", () => {
    const a = crearAleatorio(5);
    const b = crearAleatorio(5);
    intentarDescubrir(0, "energia", NIVELES_CERO, a);
    b.siguiente();
    expect(a.estado()).toBe(b.estado());
  });

  test("el progreso natural nunca supera el techo natural", () => {
    const a = crearAleatorio(3);
    let nivel = 0;
    for (let i = 0; i < 10_000; i += 1) {
      if (progresoNatural(nivel, a)) nivel += 1;
    }
    expect(nivel).toBeLessThanOrEqual(2);
  });

  test("con inversión nula y nivel en 0, el descubrimiento nunca ocurre por inversión", () => {
    const a = crearAleatorio(11);
    for (let i = 0; i < 1_000; i += 1) {
      expect(intentarDescubrir(0, "burocracia", NIVELES_CERO, a).descubierto).toBe(false);
    }
  });

  test("al nivel máximo ya no hay descubrimientos", () => {
    const a = crearAleatorio(1);
    const niveles = { ...NIVELES_CERO, energia: NIVEL_MAXIMO };
    expect(intentarDescubrir(1e9, "energia", niveles, a).descubierto).toBe(false);
  });
});

describe("tecnología y patente", () => {
  test("una tecnología sin patente solo la usa la descubridora", () => {
    const t = new Tecnologia("energia", 2, "Acme");
    expect(t.puedeUsar("Acme")).toBe(true);
    expect(t.puedeUsar("Beta")).toBe(false);
    expect(t.esPublica()).toBe(false);
  });

  test("una tecnología con patente pública la usa cualquiera", () => {
    const p = new Patente("Acme", { plazoMaximo: 1 });
    const t = new Tecnologia("procesamiento", 1, "Acme", p);
    p.avanzarCiclo();
    expect(t.esPublica()).toBe(true);
    expect(t.puedeUsar("Beta")).toBe(true);
  });

  test("rechaza nivel 0 o no entero", () => {
    expect(() => new Tecnologia("energia", 0, "Acme")).toThrow(RangeError);
  });
});

describe("reproducibilidad", () => {
  test("la misma semilla da la misma corrida completa", () => {
    const correr = (): NivelesPorCampo => {
      const a = crearAleatorio(2024);
      const niveles = { ...NIVELES_CERO };
      for (let ciclo = 0; ciclo < 200; ciclo += 1) cicloEmpresa(niveles, "procesamiento", 120, a);
      return niveles;
    };
    expect(correr()).toEqual(correr());
  });
});

describe("estabilidad a largo plazo", () => {
  const INVERSIONES = [0, 20, 60, 150, 400, 1_000];
  const CICLOS = 200;

  test("tras 200 ciclos, los niveles quedan acotados y no divergen", () => {
    for (const [i, inversion] of INVERSIONES.entries()) {
      const a = crearAleatorio(1000 + i);
      const niveles = { ...NIVELES_CERO };
      let maximo = 0;
      for (let ciclo = 0; ciclo < CICLOS; ciclo += 1) {
        cicloEmpresa(niveles, "procesamiento", inversion, a);
        maximo = Math.max(maximo, niveles.procesamiento);
      }
      expect(maximo).toBeLessThanOrEqual(NIVEL_MAXIMO);
      expect(niveles.energia).toBeLessThanOrEqual(NIVEL_MAXIMO);
      expect(niveles.burocracia).toBeLessThanOrEqual(NIVEL_MAXIMO);
    }
  });

  test("empresas con inversiones distintas no terminan todas en el mismo nivel", () => {
    const finales = INVERSIONES.map((inversion, i) => {
      const a = crearAleatorio(7 + i);
      const niveles = { ...NIVELES_CERO };
      for (let ciclo = 0; ciclo < CICLOS; ciclo += 1) {
        cicloEmpresa(niveles, "procesamiento", inversion, a);
      }
      return niveles.procesamiento;
    });
    expect(new Set(finales).size).toBeGreaterThan(1);
    // Más inversión no debería dar un nivel final menor. Hay azar, así que se tolera un nivel.
    finales.forEach((final, i) => {
      const anterior = finales[i - 1] ?? final;
      expect(final).toBeGreaterThanOrEqual(anterior - 1);
    });
  });
});
