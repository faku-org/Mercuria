import { describe, expect, test } from "bun:test";

import { crearAleatorio } from "../src/services/aleatorio";
import {
  bandasDeEscenarios,
  desvioPronostico,
  efectoProcesamientoEfectivo,
  pronosticar,
} from "../src/services/pronostico";

const SERIE = Array.from({ length: 40 }, () => 100);

function media(valores: number[]): number {
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function desvio(valores: number[]): number {
  const m = media(valores);
  return Math.sqrt(media(valores.map((v) => (v - m) ** 2)));
}

describe("desvío del pronóstico", () => {
  test("sigma crece con el horizonte", () => {
    const params = { efectoProcesamiento: 0.2 };
    expect(desvioPronostico(4, params)).toBeGreaterThan(desvioPronostico(1, params));
    expect(desvioPronostico(16, params) / desvioPronostico(4, params)).toBeCloseTo(2, 10);
  });

  test("sigma baja con el procesamiento", () => {
    const bajo = desvioPronostico(5, { efectoProcesamiento: 0.1 });
    const alto = desvioPronostico(5, { efectoProcesamiento: 0.9 });
    expect(alto).toBeLessThan(bajo);
  });

  test("con efecto 0 sigma es sigma0 × √h", () => {
    expect(desvioPronostico(9, { efectoProcesamiento: 0 })).toBeCloseTo(0.02 * 3, 10);
  });

  test("el alquiler de cómputo reduce el desvío de una empresa de baja tecnología", () => {
    const sinAlquiler = desvioPronostico(10, { efectoProcesamiento: 0 });
    const conAlquiler = desvioPronostico(10, { efectoProcesamiento: 0, unidadesAlquiladas: 50 });
    expect(conAlquiler).toBeLessThan(sinAlquiler);
  });

  test("el efecto efectivo es el mayor entre el propio y el del cómputo", () => {
    const propio = { efectoProcesamiento: 0.9, unidadesAlquiladas: 1 };
    expect(efectoProcesamientoEfectivo(propio)).toBe(0.9);
    const bajo = { efectoProcesamiento: 0, unidadesAlquiladas: 1000 };
    expect(efectoProcesamientoEfectivo(bajo)).toBeGreaterThan(0.7);
  });

  test("horizonte no positivo no tiene desvío", () => {
    expect(desvioPronostico(0, { efectoProcesamiento: 0 })).toBe(0);
  });
});

describe("pronosticar", () => {
  test("con la misma semilla el pronóstico es reproducible", () => {
    const params = { efectoProcesamiento: 0.3 };
    const a = pronosticar(SERIE, params, crearAleatorio(99));
    const b = pronosticar(SERIE, params, crearAleatorio(99));
    expect(a).toEqual(b);
  });

  test("la dispersión empírica coincide con sigma(h)", () => {
    const params = { efectoProcesamiento: 0.25 };
    const corridas = 4000;
    const horizontes = [1, 4, 9];
    const muestras = horizontes.map(() => [] as number[]);
    for (let s = 1; s <= corridas; s += 1) {
      const trayectoria = pronosticar(SERIE, params, crearAleatorio(s));
      horizontes.forEach((h, i) => muestras[i]?.push(trayectoria[h - 1] as number));
    }
    horizontes.forEach((h, i) => {
      const relativos = (muestras[i] ?? []).map((v) => v / 100 - 1);
      const esperado = desvioPronostico(h, params);
      expect(Math.abs(desvio(relativos) - esperado) / esperado).toBeLessThan(0.05);
      expect(Math.abs(media(relativos))).toBeLessThan(0.01);
    });
  });

  test("con efecto alto el pronóstico es casi exacto", () => {
    const trayectoria = pronosticar(SERIE, { efectoProcesamiento: 1 }, crearAleatorio(5));
    for (const v of trayectoria) expect(v).toBeCloseTo(100, 10);
  });
});

describe("bandasDeEscenarios", () => {
  test("percentiles correctos en un caso conocido", () => {
    const trayectorias = [
      [1, 10],
      [2, 20],
      [3, 30],
      [4, 40],
      [5, 50],
    ];
    const bandas = bandasDeEscenarios(trayectorias, [0, 50, 100]);
    expect(bandas[0]?.valores).toEqual([1, 10]);
    expect(bandas[1]?.valores).toEqual([3, 30]);
    expect(bandas[2]?.valores).toEqual([5, 50]);
  });

  test("interpola linealmente entre muestras", () => {
    const [p25] = bandasDeEscenarios([[0], [10], [20], [30]], [25]);
    expect(p25?.valores[0]).toBeCloseTo(7.5, 10);
  });

  test("no muta las trayectorias de entrada", () => {
    const trayectorias = [[3], [1], [2]];
    bandasDeEscenarios(trayectorias, [50]);
    expect(trayectorias).toEqual([[3], [1], [2]]);
  });

  test("rechaza percentiles fuera de [0, 100]", () => {
    expect(() => bandasDeEscenarios([[1]], [101])).toThrow(RangeError);
  });

  test("sin trayectorias devuelve bandas vacías", () => {
    expect(bandasDeEscenarios([], [50])).toEqual([{ percentil: 50, valores: [] }]);
  });
});
