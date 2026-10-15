import { describe, expect, test } from "bun:test";

import Ambiente from "../src/domain/Ambiente";
import Economia from "../src/domain/Economia";
import Empresa from "../src/domain/Empresa";
import Mercado from "../src/domain/Mercado";
import Recurso, { type TipoRecurso } from "../src/domain/Recurso";
import { avanzarPeriodos } from "../src/services/simulacion";
import { SEMILLA, avanzarPeriodo, crearMundo } from "../web/src/sim/motor";

/** Arma el mundo del dominio con la misma semilla que usa la demo del showcase. */
function mundoDeDominio() {
  const recursos = SEMILLA.recursos.map(
    (r) =>
      new Recurso(r.nombre, r.id as TipoRecurso, r.unidad, {
        disponibilidad: r.disponibilidad,
        regeneracion: r.regeneracion,
        consumoBase: r.consumoBase,
        precioBase: r.precioBase,
      }),
  );
  const a = SEMILLA.ambiente;
  const economia = new Economia(
    recursos,
    new Ambiente(a.contaminacion, a.temperatura, a.biodiversidad),
  );
  const mercado = new Mercado();
  const empresas = SEMILLA.empresas.map((e, indice) => {
    const empresa = new Empresa(e.nombre, indice + 1, [], e.capital, [], {
      productividad: e.productividad,
      capacidad: e.capacidad,
      acciones: e.acciones,
      intensidadEmision: e.intensidadEmision,
    });
    mercado.listarEmpresa(empresa, e.precio, e.acciones);
    return empresa;
  });
  return { economia, empresas, mercado };
}

describe("paridad del motor del showcase con el dominio", () => {
  test("el histórico coincide período a período durante 80 períodos", () => {
    const dominio = mundoDeDominio();
    const demo = crearMundo();

    for (let i = 0; i < 80; i += 1) {
      avanzarPeriodos(dominio, 1);
      avanzarPeriodo(demo);
    }

    expect(demo.historico).toHaveLength(dominio.economia.historico.length);
    demo.historico.forEach((punto, indice) => {
      const real = dominio.economia.historico[indice]!;
      expect(punto.periodo).toBe(real.periodo);
      expect(punto.pib).toBeCloseTo(real.pib, 2);
      expect(punto.productividadGlobal).toBeCloseTo(real.productividadGlobal, 6);
      expect(punto.contaminacion).toBeCloseTo(real.contaminacion, 4);
      expect(punto.indiceMercado).toBeCloseTo(real.indiceMercado, 2);
    });

    dominio.economia.recursos.forEach((recurso, indice) => {
      expect(demo.recursos[indice]!.disponibilidad).toBeCloseTo(recurso.disponibilidad, 6);
      expect(demo.recursos[indice]!.precio).toBeCloseTo(recurso.precio, 4);
    });
  });
});
