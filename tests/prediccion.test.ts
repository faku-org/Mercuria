import { describe, expect, test } from "bun:test";

import Economia from "../src/domain/Economia";
import Empresa from "../src/domain/Empresa";
import Mercado from "../src/domain/Mercado";
import Recurso from "../src/domain/Recurso";
import { predecir } from "../src/services/prediccion";
import { cantidadOyentes, publicar, suscribir } from "../src/server/eventos";

function mundoDemo() {
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
  return { economia, empresas, mercado };
}

describe("predicción aislada", () => {
  test("proyecta N puntos sin tocar el estado real", () => {
    const mundo = mundoDemo();
    const periodoAntes = mundo.economia.periodo;
    const historicoAntes = mundo.economia.historico.length;
    const productividadAntes = mundo.empresas.map((empresa) => empresa.productividad);
    const preciosAntes = mundo.mercado.cotizaciones.map((cotizacion) => cotizacion.precio);

    const puntos = predecir(mundo, 10);

    expect(puntos).toHaveLength(10);
    expect(puntos[0]?.periodo).toBe(periodoAntes);
    expect(puntos[0]?.pib).toBeGreaterThan(0);

    // El mundo real no se movió.
    expect(mundo.economia.periodo).toBe(periodoAntes);
    expect(mundo.economia.historico).toHaveLength(historicoAntes);
    expect(mundo.empresas.map((empresa) => empresa.productividad)).toEqual(productividadAntes);
    expect(mundo.mercado.cotizaciones.map((cotizacion) => cotizacion.precio)).toEqual(preciosAntes);
  });

  test("devuelve una lista vacía sin períodos", () => {
    expect(predecir(mundoDemo(), 0)).toEqual([]);
  });

  test("dos predicciones sobre el mismo mundo dan el mismo resultado", () => {
    const mundo = mundoDemo();
    const a = predecir(mundo, 5).map((punto) => punto.pib);
    const b = predecir(mundo, 5).map((punto) => punto.pib);
    expect(a).toEqual(b);
  });
});

describe("bus de eventos", () => {
  test("suscribir registra y la baja quita al oyente", () => {
    const antes = cantidadOyentes();
    let avisos = 0;
    const baja = suscribir(() => {
      avisos += 1;
    });
    expect(cantidadOyentes()).toBe(antes + 1);
    publicar();
    expect(avisos).toBe(1);
    baja();
    expect(cantidadOyentes()).toBe(antes);
  });
});
