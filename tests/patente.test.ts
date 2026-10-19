import { describe, expect, test } from "bun:test";

import Patente from "../src/domain/Patente";

describe("ciclo de vida de la patente", () => {
  test("arranca privada y sin licenciatarios", () => {
    const p = new Patente("Acme");
    expect(p.estado).toBe("privada");
    expect(p.licenciatarios).toEqual([]);
  });

  test("licenciar la pasa a licenciada y cobra regalía cada ciclo", () => {
    const p = new Patente("Acme", { plazoMaximo: 100, renovarCada: 100 });
    p.licenciar("Beta", 10);
    expect(p.estado).toBe("licenciada");
    expect(p.regaliaDe("Beta")).toBe(10);

    const ciclo = p.avanzarCiclo();
    expect(ciclo.regalias).toEqual([{ licenciatario: "Beta", monto: 10 }]);
    expect(ciclo.totalRegalias).toBe(10);
    expect(ciclo.estado).toBe("licenciada");
  });

  test("quitar la última licencia la devuelve a privada", () => {
    const p = new Patente("Acme");
    p.licenciar("Beta", 5);
    p.quitarLicencia("Beta");
    expect(p.estado).toBe("privada");
  });

  test("vence por plazo máximo y pasa a pública sin cobrar regalías", () => {
    const p = new Patente("Acme", { plazoMaximo: 3, renovarCada: 100 });
    p.licenciar("Beta", 10);
    p.avanzarCiclo();
    p.avanzarCiclo();
    const cierre = p.avanzarCiclo();
    expect(cierre.estado).toBe("publica");
    expect(cierre.motivoPublica).toBe("vencimiento");
    expect(cierre.totalRegalias).toBe(0);
    expect(p.licenciatarios).toEqual([]);
  });

  test("si no se paga la renovación, lapsa y pasa a pública antes del plazo", () => {
    const p = new Patente("Acme", { plazoMaximo: 50, renovarCada: 5 });
    for (let i = 0; i < 4; i += 1) p.avanzarCiclo();
    const lapso = p.avanzarCiclo(false);
    expect(lapso.estado).toBe("publica");
    expect(lapso.motivoPublica).toBe("lapso");
    expect(p.edad).toBe(5);
  });

  test("pagar la renovación cobra la tarifa y la siguiente crece", () => {
    const p = new Patente("Acme", {
      plazoMaximo: 50,
      renovarCada: 2,
      tarifaRenovacion: 10,
      crecimientoTarifa: 2,
    });
    p.avanzarCiclo();
    const primera = p.avanzarCiclo();
    expect(primera.tarifaCobrada).toBe(10);
    expect(p.renovaciones).toBe(1);
    expect(p.tarifaRenovacion()).toBe(20);

    p.avanzarCiclo();
    const segunda = p.avanzarCiclo();
    expect(segunda.tarifaCobrada).toBe(20);
  });

  test("una patente pública no se licencia ni avanza", () => {
    const p = new Patente("Acme", { plazoMaximo: 1 });
    p.avanzarCiclo();
    expect(p.estado).toBe("publica");
    expect(() => p.licenciar("Beta", 1)).toThrow();
    expect(() => p.avanzarCiclo()).toThrow();
    expect(() => p.quitarLicencia("Beta")).toThrow();
  });

  test("transiciones inválidas fallan de forma explícita", () => {
    const p = new Patente("Acme");
    expect(() => p.licenciar("Acme", 1)).toThrow("dueño");
    p.licenciar("Beta", 1);
    expect(() => p.licenciar("Beta", 2)).toThrow("ya es licenciatario");
    expect(() => p.quitarLicencia("Gamma")).toThrow("no es licenciatario");
    expect(() => p.licenciar("Gamma", -1)).toThrow(RangeError);
  });

  test("solo el dueño y los licenciatarios pueden usarla, salvo que sea pública", () => {
    const p = new Patente("Acme", { plazoMaximo: 2 });
    p.licenciar("Beta", 1);
    expect(p.puedeUsar("Acme")).toBe(true);
    expect(p.puedeUsar("Beta")).toBe(true);
    expect(p.puedeUsar("Gamma")).toBe(false);
    p.avanzarCiclo();
    p.avanzarCiclo();
    expect(p.puedeUsar("Gamma")).toBe(true);
  });

  test("parámetros inválidos fallan al construir", () => {
    expect(() => new Patente("Acme", { plazoMaximo: 0 })).toThrow(RangeError);
    expect(() => new Patente("Acme", { renovarCada: 1.5 })).toThrow(RangeError);
    expect(() => new Patente("Acme", { crecimientoTarifa: 0.9 })).toThrow(RangeError);
  });
});
