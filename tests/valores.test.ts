import { describe, expect, test } from "bun:test";

import { VALORES, afinidad, valoresNulos } from "../src/domain/contratosTecnologia";
import type { Valor, VectorValores } from "../src/domain/contratosTecnologia";
import { crearAleatorio } from "../src/services/aleatorio";
import {
  ENTROPIA_MAXIMA,
  ENTROPIA_MINIMA,
  LARGO_MAXIMO,
  LARGO_MINIMO,
  entropiaShannon,
  extraerValores,
  extraerValoresAsync,
  extractorLexico,
  type Extraccion,
  type ExtractorValores,
  type ResultadoValores,
} from "../src/services/valores";

/** Genera un texto de `largo` caracteres tomados del alfabeto, con semilla fija. */
function azar(alfabeto: string, largo: number, semilla: number): string {
  const aleatorio = crearAleatorio(semilla);
  let salida = "";
  for (let i = 0; i < largo; i += 1) {
    salida += alfabeto[Math.floor(aleatorio.siguiente() * alfabeto.length)];
  }
  return salida;
}

const DESCRIPCIONES = {
  energiaRenovable:
    "Desarrollamos parques solares y eólicos para generar electricidad limpia y renovable, reduciendo las emisiones de carbono de los hogares y las industrias de la región con proyectos sostenibles.",
  defensa:
    "Fabricamos sistemas de defensa, vehículos blindados y equipamiento táctico para las fuerzas armadas y los ejércitos aliados, con estándares de control de misiles y municiones para operaciones navales.",
  fluidoSinSentido:
    "La cosmética del horizonte aplica ventanas lentas sobre tambores de lluvia, mientras los cuadernos del puerto recuerdan silencios destilados en música de vidrio tibio y calles de arena.",
  lorem:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.",
  tecnologia:
    "Somos un laboratorio de investigación en inteligencia artificial y software. Desarrollamos algoritmos, prototipos y robots para automatizar procesos científicos en la industria.",
  social:
    "Trabajamos con comunidades vulnerables para mejorar la educación, la salud y el acceso a la vivienda digna, con programas de inclusión y cooperativas de trabajadores.",
  lucro:
    "Nuestro objetivo es maximizar la rentabilidad y el retorno para los accionistas, con márgenes altos, ventas crecientes y una facturación que escale en el mercado competitivo.",
  estabilidad:
    "Priorizamos la solidez financiera, la previsibilidad y el crecimiento gradual, con un manejo prudente del riesgo, reservas de ahorro y una estructura resiliente a la volatilidad.",
} as const;

describe("entropiaShannon", () => {
  test("un solo carácter repetido tiene entropía 0", () => {
    expect(entropiaShannon("a".repeat(200))).toBe(0);
  });

  test("una frase repetida queda por debajo de la banda", () => {
    const frase = "la empresa crece. ".repeat(12);
    expect(entropiaShannon(frase)).toBeLessThan(ENTROPIA_MINIMA);
  });

  test("letras al azar superan la banda", () => {
    const letras = azar("abcdefghijklmnopqrstuvwxyz", 200, 1);
    expect(entropiaShannon(letras)).toBeGreaterThan(ENTROPIA_MAXIMA);
  });

  test("alfanumérico al azar supera la banda con holgura", () => {
    const alfanumerico = azar(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      200,
      2,
    );
    expect(entropiaShannon(alfanumerico)).toBeGreaterThan(5.5);
  });

  test("teclado mecanografiado al azar supera la banda", () => {
    const teclado = azar("qwertyuiopasdfghjklzxcvbnm", 200, 3);
    expect(entropiaShannon(teclado)).toBeGreaterThan(ENTROPIA_MAXIMA);
  });

  test("descripciones reales en español caen dentro de la banda", () => {
    for (const texto of [DESCRIPCIONES.energiaRenovable, DESCRIPCIONES.defensa]) {
      const entropia = entropiaShannon(texto);
      expect(entropia).toBeGreaterThanOrEqual(ENTROPIA_MINIMA);
      expect(entropia).toBeLessThanOrEqual(ENTROPIA_MAXIMA);
    }
  });

  test("texto fluido sin sentido y lorem ipsum PASAN la entropía (no es un filtro semántico)", () => {
    for (const texto of [DESCRIPCIONES.fluidoSinSentido, DESCRIPCIONES.lorem]) {
      const entropia = entropiaShannon(texto);
      expect(entropia).toBeGreaterThanOrEqual(ENTROPIA_MINIMA);
      expect(entropia).toBeLessThanOrEqual(ENTROPIA_MAXIMA);
    }
  });

  test("texto vacío tiene entropía 0", () => {
    expect(entropiaShannon("")).toBe(0);
  });
});

describe("sanidad del texto", () => {
  test("rechaza texto por debajo del largo mínimo", () => {
    expect(extraerValores("solar y limpio")).toEqual({ ok: false, motivo: "demasiado_corto" });
    expect(extraerValores("a".repeat(LARGO_MINIMO - 1))).toEqual({
      ok: false,
      motivo: "demasiado_corto",
    });
  });

  test("rechaza texto por encima del largo máximo", () => {
    const largo = DESCRIPCIONES.energiaRenovable.repeat(10).slice(0, LARGO_MAXIMO + 1);
    expect(extraerValores(largo)).toEqual({ ok: false, motivo: "demasiado_largo" });
  });

  test("el largo se mide después de colapsar espacios y recortar bordes", () => {
    const conRelleno = `      ${"a".repeat(LARGO_MINIMO - 1)}    `;
    expect(extraerValores(conRelleno)).toEqual({ ok: false, motivo: "demasiado_corto" });
  });

  test("no aplica la banda de entropía por debajo del largo mínimo de entropía", () => {
    // Repetición perfecta: con 80 caracteres o más se rechazaría por entropía baja.
    // Con menos, la medición es ruidosa, así que se deja pasar a la extracción.
    const corto = "energía solar renovable ".repeat(3).slice(0, 60);
    const resultado = extraerValores(corto);
    expect(resultado.ok).toBe(true);
  });

  test("texto repetido de largo suficiente se rechaza por entropía baja", () => {
    const repetido = "la empresa crece. ".repeat(12);
    expect(extraerValores(repetido)).toEqual({ ok: false, motivo: "entropia_baja" });
  });

  test("texto de caracteres al azar se rechaza por entropía alta", () => {
    const azarAlto = azar("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 200, 2);
    expect(extraerValores(azarAlto)).toEqual({ ok: false, motivo: "entropia_alta" });
  });

  test("teclado al azar se rechaza por entropía alta", () => {
    const teclado = azar("qwertyuiopasdfghjklzxcvbnm", 200, 3);
    expect(extraerValores(teclado)).toEqual({ ok: false, motivo: "entropia_alta" });
  });
});

describe("extraerValores con el extractor léxico", () => {
  test("una empresa de energía renovable da ecosistema como dominante", () => {
    const resultado = extraerValores(DESCRIPCIONES.energiaRenovable);
    expectOk(resultado);
    expect(resultado.dominantes).toEqual(["ecosistema"]);
    expect(resultado.valores.ecosistema).toBeGreaterThan(0.5);
  });

  test("una empresa de defensa da militar como dominante", () => {
    const resultado = extraerValores(DESCRIPCIONES.defensa);
    expectOk(resultado);
    expect(resultado.dominantes).toEqual(["militar"]);
  });

  test("un laboratorio de IA da innovacion como dominante", () => {
    const resultado = extraerValores(DESCRIPCIONES.tecnologia);
    expectOk(resultado);
    expect(resultado.dominantes).toContain("innovacion");
  });

  test("una organización social da social como dominante", () => {
    const resultado = extraerValores(DESCRIPCIONES.social);
    expectOk(resultado);
    expect(resultado.dominantes).toEqual(["social"]);
  });

  test("una empresa orientada al lucro da lucro como dominante", () => {
    const resultado = extraerValores(DESCRIPCIONES.lucro);
    expectOk(resultado);
    expect(resultado.dominantes).toEqual(["lucro"]);
  });

  test("una empresa prudente da estabilidad como dominante", () => {
    const resultado = extraerValores(DESCRIPCIONES.estabilidad);
    expectOk(resultado);
    expect(resultado.dominantes).toEqual(["estabilidad"]);
  });

  test("caso mixto: militar y ecosistema aparecen juntos como dominantes", () => {
    const mixto =
      "Fabricamos sistemas de defensa y equipamiento militar para las fuerzas armadas, y también desarrollamos energía solar renovable para reducir la contaminación ambiental.";
    const resultado = extraerValores(mixto);
    expectOk(resultado);
    expect(resultado.dominantes).toEqual(expect.arrayContaining(["militar", "ecosistema"]));
  });

  test("texto fluido sin sentido se rechaza con sin_valores (filtro semántico)", () => {
    expect(extraerValores(DESCRIPCIONES.fluidoSinSentido)).toEqual({
      ok: false,
      motivo: "sin_valores",
    });
  });

  test("lorem ipsum se rechaza con sin_valores (filtro semántico)", () => {
    expect(extraerValores(DESCRIPCIONES.lorem)).toEqual({ ok: false, motivo: "sin_valores" });
  });

  test("un texto sano sin ningún término del léxico se rechaza con sin_valores", () => {
    const sinTerminos =
      "Vendemos muebles de madera artesanal hechos a mano por carpinteros de la zona, con entregas a domicilio.";
    expect(extraerValores(sinTerminos)).toEqual({ ok: false, motivo: "sin_valores" });
  });

  test("inmune a mayúsculas y tildes: la misma descripción da el mismo resultado", () => {
    const original = extraerValores(DESCRIPCIONES.energiaRenovable);
    const mayusculas = extraerValores(DESCRIPCIONES.energiaRenovable.toUpperCase());
    const sinTildes = extraerValores(
      DESCRIPCIONES.energiaRenovable.normalize("NFD").replace(/[̀-ͯ]/g, ""),
    );
    expectOk(original);
    expectOk(mayusculas);
    expectOk(sinTildes);
    expect(mayusculas.valores).toEqual(original.valores);
    expect(sinTildes.valores).toEqual(original.valores);
  });

  test("el stemming simple reconoce variantes de una misma raíz", () => {
    const militar = extraerValores(
      "Somos una empresa dedicada a la defensa, con ejércitos y armamento para operaciones navales.",
    );
    expectOk(militar);
    expect(militar.dominantes).toEqual(["militar"]);
  });

  test("cada componente del vector queda en [0, 1]", () => {
    for (const texto of Object.values(DESCRIPCIONES)) {
      const resultado = extraerValores(texto);
      if (!resultado.ok) continue;
      for (const valor of VALORES) {
        expect(resultado.valores[valor]).toBeGreaterThanOrEqual(0);
        expect(resultado.valores[valor]).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("interfaz ExtractorValores intercambiable", () => {
  test("acepta un extractor propio y usa su vector", () => {
    const fijo: VectorValores = { ...valoresNulos(), social: 0.9 };
    const extractor: ExtractorValores = { extraer: () => ({ valores: fijo, confianza: 0.8 }) };
    const resultado = extraerValores(DESCRIPCIONES.lucro, extractor);
    expectOk(resultado);
    expect(resultado.dominantes).toEqual(["social"]);
  });

  test("el extractor recibe el texto saneado y los filtros de sanidad se aplican igual", () => {
    let recibido = "";
    const extractor: ExtractorValores = {
      extraer(texto) {
        recibido = texto;
        return { valores: { ...valoresNulos(), lucro: 1 }, confianza: 1 };
      },
    };
    extraerValores(`   ${DESCRIPCIONES.lucro}    extra   `, extractor);
    expect(recibido).toBe(DESCRIPCIONES.lucro.concat(" extra"));
    expect(extraerValores("corto", extractor)).toEqual({ ok: false, motivo: "demasiado_corto" });
  });

  test("confianza por debajo del umbral se rechaza con sin_valores", () => {
    const extractor: ExtractorValores = {
      extraer: () => ({ valores: { ...valoresNulos(), lucro: 0.9 }, confianza: 0.1 }),
    };
    expect(extraerValores(DESCRIPCIONES.lucro, extractor)).toEqual({
      ok: false,
      motivo: "sin_valores",
    });
  });

  test("vector nulo se rechaza con sin_valores aunque la confianza sea alta", () => {
    const extractor: ExtractorValores = {
      extraer: () => ({ valores: valoresNulos(), confianza: 1 }),
    };
    expect(extraerValores(DESCRIPCIONES.lucro, extractor)).toEqual({
      ok: false,
      motivo: "sin_valores",
    });
  });

  test("la salida del extractor se normaliza: clamp a [0, 1], NaN a 0 y claves ajenas ignoradas", () => {
    const sucia = {
      lucro: 3,
      militar: -2,
      social: Number.NaN,
      marciano: 1,
    } as unknown as VectorValores;
    const extractor: ExtractorValores = {
      extraer: () => ({ valores: sucia, confianza: 2 }),
    };
    const resultado = extraerValores(DESCRIPCIONES.lucro, extractor);
    expectOk(resultado);
    expect(resultado.valores).toEqual({ ...valoresNulos(), lucro: 1 });
    expect(resultado.confianza).toBe(1);
    expect(Object.keys(resultado.valores).sort()).toEqual([...VALORES].sort());
  });

  test("extractorLexico cumple la interfaz y es el predeterminado", () => {
    const explicito = extraerValores(DESCRIPCIONES.defensa, extractorLexico);
    const predeterminado = extraerValores(DESCRIPCIONES.defensa);
    expect(explicito).toEqual(predeterminado);
  });

  test("variante asíncrona: misma lógica de sanidad y normalización", async () => {
    const extractor = {
      extraer: async (): Promise<Extraccion> => ({
        valores: { ...valoresNulos(), estabilidad: 0.7 },
        confianza: 0.7,
      }),
    };
    const resultado = await extraerValoresAsync(DESCRIPCIONES.estabilidad, extractor);
    expectOk(resultado);
    expect(resultado.dominantes).toEqual(["estabilidad"]);
    expect(await extraerValoresAsync("a".repeat(200), extractor)).toEqual({
      ok: false,
      motivo: "entropia_baja",
    });
  });
});

describe("compatibilidad con afinidad() de los contratos", () => {
  test("una empresa ecológica tiene afinidad alta con un investigador ecológico", () => {
    const empresa = extraerValores(DESCRIPCIONES.energiaRenovable);
    expectOk(empresa);
    const investigador: VectorValores = { ...valoresNulos(), ecosistema: 1 };
    expect(afinidad(empresa.valores, investigador)).toBeGreaterThan(0.5);
  });

  test("una empresa militar tiene afinidad nula con un investigador ecológico puro", () => {
    const empresa = extraerValores(DESCRIPCIONES.defensa);
    expectOk(empresa);
    const investigador: VectorValores = { ...valoresNulos(), ecosistema: 1 };
    expect(afinidad(empresa.valores, investigador)).toBeCloseTo(0, 5);
  });

  test("el vector producido está en la taxonomía cerrada y es comparable", () => {
    const resultado = extraerValores(DESCRIPCIONES.lucro);
    expectOk(resultado);
    const claves: Valor[] = [...VALORES];
    expect(Object.keys(resultado.valores).sort()).toEqual(claves.sort());
    expect(afinidad(resultado.valores, resultado.valores)).toBeCloseTo(1, 5);
  });
});

/** Reduce el tipo a `ok: true` para poder leer `valores` y `dominantes` sin casteos. */
function expectOk(
  resultado: ResultadoValores,
): asserts resultado is Extract<ResultadoValores, { ok: true }> {
  expect(resultado.ok).toBe(true);
}
