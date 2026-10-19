import { describe, expect, test } from "bun:test";

import { VALORES, afinidad, valoresNulos } from "../src/domain/contratosTecnologia";
import { crearAleatorio, normal, restaurarAleatorio } from "../src/services/aleatorio";

describe("aleatorio con semilla", () => {
  test("la misma semilla da la misma secuencia", () => {
    const a = crearAleatorio(42);
    const b = crearAleatorio(42);
    for (let i = 0; i < 50; i += 1) expect(a.siguiente()).toBe(b.siguiente());
  });

  test("semillas distintas dan secuencias distintas", () => {
    expect(crearAleatorio(1).siguiente()).not.toBe(crearAleatorio(2).siguiente());
  });

  test("restaurar desde el estado continúa la secuencia", () => {
    const original = crearAleatorio(7);
    for (let i = 0; i < 10; i += 1) original.siguiente();
    const retomado = restaurarAleatorio(original.estado());
    for (let i = 0; i < 20; i += 1) expect(retomado.siguiente()).toBe(original.siguiente());
  });

  test("los valores están en [0, 1) y la media ronda 0,5", () => {
    const a = crearAleatorio(123);
    let suma = 0;
    for (let i = 0; i < 10_000; i += 1) {
      const x = a.siguiente();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      suma += x;
    }
    expect(suma / 10_000).toBeCloseTo(0.5, 1);
  });

  test("normal tiene media ~0 y desvío ~1", () => {
    const a = crearAleatorio(99);
    const xs = Array.from({ length: 20_000 }, () => normal(a));
    const media = xs.reduce((s, x) => s + x, 0) / xs.length;
    const varianza = xs.reduce((s, x) => s + (x - media) ** 2, 0) / xs.length;
    expect(media).toBeCloseTo(0, 1);
    expect(Math.sqrt(varianza)).toBeCloseTo(1, 1);
  });
});

describe("afinidad entre vectores de valores", () => {
  test("vectores iguales tienen afinidad 1", () => {
    const v = { ...valoresNulos(), ecosistema: 0.8, innovacion: 0.4 };
    expect(afinidad(v, v)).toBeCloseTo(1, 6);
  });

  test("vectores ortogonales tienen afinidad 0", () => {
    const a = { ...valoresNulos(), militar: 1 };
    const b = { ...valoresNulos(), ecosistema: 1 };
    expect(afinidad(a, b)).toBe(0);
  });

  test("un vector nulo tiene afinidad 0 con todo", () => {
    expect(afinidad(valoresNulos(), { ...valoresNulos(), lucro: 1 })).toBe(0);
  });

  test("la escala no cambia la afinidad", () => {
    const a = { ...valoresNulos(), social: 0.2, estabilidad: 0.1 };
    const b = { ...valoresNulos(), social: 0.8, estabilidad: 0.4 };
    expect(afinidad(a, b)).toBeCloseTo(1, 6);
  });

  test("la taxonomía tiene 6 valores", () => {
    expect(VALORES).toHaveLength(6);
  });
});
