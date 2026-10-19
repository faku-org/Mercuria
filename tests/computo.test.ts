import { describe, expect, test } from "bun:test";

import Datacenter from "../src/domain/Datacenter";
import {
  alquilarComputo,
  cotizarAlquiler,
  demandaEnergiaOcupada,
  efectoDeComputo,
  liberarComputo,
} from "../src/services/computo";

const DISPONIBLE = { agua: 1000, electricidad: 1000, combustible: 1000, minerales: 1000 };

function datacenterBase(ocupacion = 0): Datacenter {
  return new Datacenter("Norte", "Uruguay", "Montevideo", 100, {
    consumoElectricidad: 0.01,
    consumoRecursos: { agua: 0.5 },
    precioBase: 2,
    ocupacion,
  });
}

describe("Datacenter", () => {
  test("la ocupación no supera la capacidad total ni baja de 0", () => {
    const dc = new Datacenter("X", "N", "E", 10, { ocupacion: 50 });
    expect(dc.ocupacion).toBe(10);
    dc.liberar(100);
    expect(dc.ocupacion).toBe(0);
  });

  test("el precio sube con la ocupación", () => {
    const dc = datacenterBase();
    const precios = [0, 0.25, 0.5, 0.75, 1].map((t) => dc.precioConTasa(t));
    for (let i = 1; i < precios.length; i += 1) {
      expect(precios[i]).toBeGreaterThan(precios[i - 1] as number);
    }
    expect(dc.precioConTasa(0)).toBe(2);
  });

  test("reservar falla sin capacidad y no modifica nada", () => {
    const dc = datacenterBase(95);
    expect(dc.reservar(10)).toBe(false);
    expect(dc.ocupacion).toBe(95);
    expect(dc.reservar(5)).toBe(true);
    expect(dc.capacidadDisponible()).toBe(0);
  });
});

describe("alquiler de cómputo", () => {
  test("no se puede alquilar sin datacenter", () => {
    const resultado = alquilarComputo([], 10, DISPONIBLE);
    expect(resultado).toEqual({ ok: false, motivo: "sin_infraestructura" });
  });

  test("no se puede alquilar fuera de la ubicación del datacenter", () => {
    const resultado = alquilarComputo([datacenterBase()], 10, DISPONIBLE, { nacion: "Chile" });
    expect(resultado).toEqual({ ok: false, motivo: "sin_infraestructura" });
  });

  test("no se puede alquilar sin los recursos que consume", () => {
    const resultado = alquilarComputo([datacenterBase()], 10, {
      ...DISPONIBLE,
      agua: 0,
    });
    expect(resultado).toEqual({
      ok: false,
      motivo: "recursos_insuficientes",
      recursoFaltante: "agua",
    });
  });

  test("no se puede alquilar sin electricidad disponible", () => {
    const resultado = alquilarComputo([datacenterBase()], 10, {
      ...DISPONIBLE,
      electricidad: 0.01,
    });
    expect(resultado).toMatchObject({ ok: false, recursoFaltante: "electricidad" });
  });

  test("no se puede alquilar más que la capacidad libre", () => {
    const resultado = alquilarComputo([datacenterBase(95)], 10, DISPONIBLE);
    expect(resultado).toEqual({ ok: false, motivo: "capacidad_insuficiente" });
  });

  test("cantidades inválidas se rechazan", () => {
    expect(cotizarAlquiler([datacenterBase()], 0, DISPONIBLE)).toEqual({
      ok: false,
      motivo: "cantidad_invalida",
    });
    expect(cotizarAlquiler([datacenterBase()], 2.5, DISPONIBLE)).toEqual({
      ok: false,
      motivo: "cantidad_invalida",
    });
  });

  test("la capacidad alquilada se descuenta del propietario", () => {
    const dc = datacenterBase(20);
    const resultado = alquilarComputo([dc], 30, DISPONIBLE);
    expect(resultado.ok).toBe(true);
    expect(dc.ocupacion).toBe(50);
    if (!resultado.ok) return;
    expect(resultado.demandaEnergia).toBeCloseTo(30 * 0.01, 10);
    expect(demandaEnergiaOcupada([dc])).toBeCloseTo(50 * 0.01, 10);
  });

  test("un alquiler fallido no descuenta nada", () => {
    const dc = datacenterBase();
    alquilarComputo([dc], 10, { ...DISPONIBLE, agua: 0 });
    expect(dc.ocupacion).toBe(0);
  });

  test("el alquiler se llena primero en el datacenter más barato", () => {
    const barato = new Datacenter("B", "N", "E", 10, { precioBase: 1 });
    const caro = new Datacenter("C", "N", "E", 10, { precioBase: 5 });
    const resultado = alquilarComputo([caro, barato], 8, DISPONIBLE);
    expect(resultado.ok && resultado.asignaciones).toEqual([
      expect.objectContaining({ datacenterId: barato.id, unidades: 8 }),
    ]);
  });

  test("liberar devuelve la capacidad", () => {
    const dc = datacenterBase();
    const resultado = alquilarComputo([dc], 10, DISPONIBLE);
    if (!resultado.ok) throw new Error("el alquiler debía funcionar");
    liberarComputo([dc], resultado.asignaciones);
    expect(dc.ocupacion).toBe(0);
  });

  test("el precio por unidad sube con la ocupación de forma creciente", () => {
    const vacio = cotizarAlquiler([datacenterBase(0)], 10, DISPONIBLE);
    const lleno = cotizarAlquiler([datacenterBase(80)], 10, DISPONIBLE);
    if (!vacio.ok || !lleno.ok) throw new Error("ambos alquileres debían funcionar");
    expect(lleno.costo).toBeGreaterThan(vacio.costo);
  });

  test("el efecto del cómputo tiene rendimientos decrecientes y se acota", () => {
    const e1 = efectoDeComputo(10);
    const e2 = efectoDeComputo(20);
    const e3 = efectoDeComputo(40);
    expect(e2 - e1).toBeGreaterThan(e3 - e2);
    expect(efectoDeComputo(1e6)).toBeLessThan(1);
    expect(efectoDeComputo(0)).toBe(0);
  });
});
