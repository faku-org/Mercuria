import { VALORES, valoresNulos } from "../domain/contratosTecnologia";
import type { Valor, VectorValores } from "../domain/contratosTecnologia";

/**
 * Valores de la empresa a partir de la descripción que escribe el usuario al crearla.
 * Ver docs/tecnologia.md, sección 5. Módulo puro y sin estado global.
 *
 * Pipeline:
 *   1. Sanidad: largo mínimo y máximo, y banda de entropía de Shannon por carácter.
 *      La entropía es SOLO un primer filtro barato: corta repetición, azar y teclado,
 *      pero no valida significado (el texto fluido sin sentido y el lorem ipsum pasan).
 *   2. Extracción: un `ExtractorValores` mapea el texto a un `VectorValores` de la taxonomía
 *      cerrada `VALORES`, con una confianza.
 *   3. Confianza: si ningún valor la supera, se rechaza con `sin_valores`. ESE es el filtro
 *      semántico real.
 *
 * Reemplazo del extractor (embeddings o un LLM): basta con implementar `ExtractorValores`
 * (o `ExtractorValoresAsync`) y pasarlo a `extraerValores`; el resto no cambia. Si se usa un
 * LLM: la salida debe restringirse a la taxonomía `VALORES` (esquema cerrado, nada de claves
 * libres) y el texto del usuario NUNCA se trata como instrucciones (prompt injection): va
 * como dato delimitado, sin concatenarlo al prompt de sistema. `extraerValores` igual
 * normaliza la salida (clamp a [0, 1], ignora claves ajenas) como última defensa.
 */

// ---------------------------------------------------------------------------
// Constantes de calibración (propuestas de arranque, se afinan con tests).
// ---------------------------------------------------------------------------

/** Largo mínimo de la descripción (caracteres, con espacios colapsados y sin bordes). */
const LARGO_MINIMO = 20;
/** Largo máximo de la descripción. */
const LARGO_MAXIMO = 1000;
/**
 * Por debajo de este largo NO se aplica la banda de entropía: con pocos caracteres la
 * entropía empírica es ruidosa (y subestimada), así que daría falsos rechazos.
 */
const LARGO_MINIMO_ENTROPIA = 80;
/** Banda de entropía por carácter (bits) esperable en español. Fuera de ella se rechaza. */
const ENTROPIA_MINIMA = 3.3;
const ENTROPIA_MAXIMA = 4.4;
/** Confianza mínima (en [0, 1]) para aceptar el vector. Debajo: `sin_valores`. */
const UMBRAL_CONFIANZA = 0.5;
/**
 * Escala de saturación del extractor léxico: componente = 1 - e^(-puntaje / ESCALA).
 * Con 2, hacen falta unos 1,4 puntos (dos términos fuertes) para llegar al umbral.
 */
const ESCALA_PUNTAJE = 2;
/** Un valor es dominante si su componente es al menos esta fracción de la mayor. */
const DOMINANCIA_RELATIVA = 0.6;
/** Los tokens más cortos que esto se ignoran. */
const LARGO_MINIMO_TOKEN = 3;

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/** Salida de un extractor: el vector y qué tan seguro está (ambos en [0, 1]). */
interface Extraccion {
  valores: VectorValores;
  confianza: number;
}

/** Contrato intercambiable: léxico hoy, embeddings o LLM mañana. Recibe el texto ya saneado. */
interface ExtractorValores {
  extraer(texto: string): Extraccion;
}

/** Variante asíncrona para extractores remotos (LLM, embeddings por red). */
interface ExtractorValoresAsync {
  extraer(texto: string): Promise<Extraccion>;
}

type MotivoRechazo =
  | "demasiado_corto"
  | "demasiado_largo"
  | "entropia_baja"
  | "entropia_alta"
  | "sin_valores";

type ResultadoValores =
  | { ok: true; valores: VectorValores; confianza: number; dominantes: Valor[] }
  | { ok: false; motivo: MotivoRechazo };

// ---------------------------------------------------------------------------
// Entropía y sanidad
// ---------------------------------------------------------------------------

/** Espacios colapsados y sin bordes. Conserva tildes (son caracteres reales). */
function limpiarTexto(texto: string): string {
  return texto.trim().replace(/\s+/g, " ");
}

/** Entropía de Shannon de orden 0 por carácter, en bits, sobre el texto crudo. Vacío: 0. */
function entropiaShannon(texto: string): number {
  const caracteres = Array.from(texto);
  if (caracteres.length === 0) return 0;
  const frecuencias = new Map<string, number>();
  for (const c of caracteres) frecuencias.set(c, (frecuencias.get(c) ?? 0) + 1);
  let entropia = 0;
  for (const cuenta of frecuencias.values()) {
    const p = cuenta / caracteres.length;
    entropia -= p * Math.log2(p);
  }
  return entropia;
}

/** Verifica largo y entropía. Devuelve el motivo de rechazo o `null` si el texto es sano. */
function verificarSanidad(texto: string): MotivoRechazo | null {
  const limpio = limpiarTexto(texto);
  const largo = Array.from(limpio).length;
  if (largo < LARGO_MINIMO) return "demasiado_corto";
  if (largo > LARGO_MAXIMO) return "demasiado_largo";
  if (largo >= LARGO_MINIMO_ENTROPIA) {
    const entropia = entropiaShannon(limpio);
    if (entropia < ENTROPIA_MINIMA) return "entropia_baja";
    if (entropia > ENTROPIA_MAXIMA) return "entropia_alta";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Extractor léxico
// ---------------------------------------------------------------------------

/** Minúsculas y sin tildes (la ñ pasa a n). Los términos del léxico se normalizan igual. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Léxico por valor. Cada entrada es una RAÍZ (stemming simple: un token coincide si empieza
 * con ella, así "militar" cubre militares, militarizar, etc.) y su peso, que hace de IDF
 * estático: 1 para términos específicos del valor, 0,5 para los ambiguos. Una raíz con
 * prefijo "=" exige coincidencia exacta del token. Cada raíz pertenece a un solo valor.
 */
const LEXICO: Record<Valor, ReadonlyArray<readonly [string, number]>> = {
  militar: [
    ["militar", 1],
    ["ejercit", 1],
    ["defensa", 1],
    ["armament", 1],
    ["armad", 1],
    ["=arma", 1],
    ["=armas", 1],
    ["soldad", 1],
    ["belic", 1],
    ["guerr", 1],
    ["misil", 1],
    ["municion", 1],
    ["combat", 1],
    ["naval", 1],
    ["tactic", 1],
    ["blindad", 1],
    ["cuartel", 1],
    ["veterano", 1],
    ["fuerzas", 0.5],
    ["frontera", 0.5],
    ["patrulla", 0.5],
    ["vigilancia", 0.5],
  ],
  ecosistema: [
    ["ecolog", 1],
    ["ecosistem", 1],
    ["ambiental", 1],
    ["medioambient", 1],
    ["medio ambiente", 1],
    ["sustentab", 1],
    ["sostenib", 1],
    ["renovabl", 1],
    ["biodivers", 1],
    ["reforest", 1],
    ["bosque", 1],
    ["carbono", 1],
    ["recicl", 1],
    ["contamin", 1],
    ["naturalez", 1],
    ["conservacion", 1],
    ["climatic", 1],
    ["clima", 1],
    ["solar", 1],
    ["eolic", 1],
    ["hidroelectr", 1],
    ["geotermic", 1],
    ["fauna", 1],
    ["flora", 1],
    ["residuos", 1],
    ["huella", 0.5],
    ["verde", 0.5],
    ["limpi", 0.5],
    ["organic", 0.5],
    ["emisiones", 0.5],
  ],
  lucro: [
    ["lucr", 1],
    ["ganancia", 1],
    ["rentabil", 1],
    ["rentable", 1],
    ["dividend", 1],
    ["accionista", 1],
    ["inversor", 1],
    ["utilidades", 1],
    ["retorno", 1],
    ["margen", 1],
    ["maximiz", 1],
    ["facturacion", 1],
    ["monetiz", 1],
    ["ingresos", 0.5],
    ["negocio", 0.5],
    ["ventas", 0.5],
    ["comerci", 0.5],
    ["mercado", 0.5],
    ["competitiv", 0.5],
    ["rendimiento", 0.5],
    ["precio", 0.5],
    ["beneficios", 0.5],
  ],
  innovacion: [
    ["innov", 1],
    ["tecnolog", 1],
    ["biotec", 1],
    ["investig", 1],
    ["laboratori", 1],
    ["cientific", 1],
    ["ciencia", 1],
    ["algoritm", 1],
    ["prototip", 1],
    ["startup", 1],
    ["vanguardia", 1],
    ["disrupt", 1],
    ["patente", 1],
    ["experiment", 1],
    ["software", 1],
    ["robot", 1],
    ["cuantic", 1],
    ["descubr", 1],
    ["automatiz", 1],
    ["digital", 0.5],
    ["inteligencia", 0.5],
    ["creativ", 0.5],
    ["desarrollo", 0.5],
  ],
  social: [
    ["social", 1],
    ["comunidad", 1],
    ["comunitari", 1],
    ["solidari", 1],
    ["inclusi", 1],
    ["educacion", 1],
    ["salud", 1],
    ["vulnerab", 1],
    ["pobreza", 1],
    ["voluntari", 1],
    ["equidad", 1],
    ["igualdad", 1],
    ["bienestar", 1],
    ["vivienda", 1],
    ["cooperativ", 1],
    ["derechos", 1],
    ["infancia", 1],
    ["=ong", 1],
    ["ayuda", 0.5],
    ["familias", 0.5],
    ["trabajadores", 0.5],
    ["acceso", 0.5],
    ["digno", 0.5],
  ],
  estabilidad: [
    ["estabil", 1],
    ["solidez", 1],
    ["confiab", 1],
    ["fiabil", 1],
    ["prudent", 1],
    ["conservador", 1],
    ["tradicion", 1],
    ["patrimonio", 1],
    ["ahorro", 1],
    ["previsib", 1],
    ["predecib", 1],
    ["continuidad", 1],
    ["consolid", 1],
    ["resilien", 1],
    ["volatil", 1],
    ["robustez", 1],
    ["equilibr", 1],
    ["perdurable", 1],
    ["permanen", 0.5],
    ["gradual", 0.5],
    ["riesgo", 0.5],
    ["plazo", 0.5],
    ["segur", 0.5],
    ["mantener", 0.5],
  ],
};

interface EntradaLexico {
  valor: Valor;
  raiz: string;
  exacta: boolean;
  peso: number;
}

/** Léxico aplanado y normalizado, calculado una sola vez al cargar el módulo. */
const ENTRADAS: readonly EntradaLexico[] = VALORES.flatMap((valor) =>
  LEXICO[valor].map(([crudo, peso]) => {
    const exacta = crudo.startsWith("=");
    return { valor, raiz: normalizar(exacta ? crudo.slice(1) : crudo), exacta, peso };
  }),
);

/** Tokens normalizados (minúsculas, sin tildes) de al menos `LARGO_MINIMO_TOKEN` letras. */
function tokenizar(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= LARGO_MINIMO_TOKEN);
}

/**
 * Extractor léxico tipo TF-IDF sin dependencias. Por cada raíz del léxico cuenta cuántos
 * tokens coinciden (tf sublineal: 1 + ln(n), para que repetir una palabra no explote el
 * puntaje) y lo multiplica por su peso (idf estático). El puntaje de cada valor se satura a
 * [0, 1) con 1 - e^(-puntaje / ESCALA_PUNTAJE). La confianza es la mayor componente.
 */
const extractorLexico: ExtractorValores = {
  extraer(texto) {
    // Las frases del léxico (con espacios) se buscan en el texto normalizado completo.
    const normalizado = normalizar(texto);
    const tokens = tokenizar(texto);
    const puntajes = valoresNulos();
    for (const entrada of ENTRADAS) {
      let cuenta = 0;
      if (entrada.raiz.includes(" ")) {
        cuenta = normalizado.split(entrada.raiz).length - 1;
      } else {
        for (const token of tokens) {
          if (entrada.exacta ? token === entrada.raiz : token.startsWith(entrada.raiz)) cuenta += 1;
        }
      }
      if (cuenta > 0) puntajes[entrada.valor] += entrada.peso * (1 + Math.log(cuenta));
    }
    const valores = valoresNulos();
    let confianza = 0;
    for (const valor of VALORES) {
      valores[valor] = 1 - Math.exp(-puntajes[valor] / ESCALA_PUNTAJE);
      confianza = Math.max(confianza, valores[valor]);
    }
    return { valores, confianza };
  },
};

// ---------------------------------------------------------------------------
// API principal
// ---------------------------------------------------------------------------

function acotar(x: unknown): number {
  return typeof x === "number" && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;
}

/** Normaliza la salida de un extractor (puede ser un LLM) y decide aceptación o rechazo. */
function armarResultado(extraccion: Extraccion): ResultadoValores {
  const valores = valoresNulos();
  for (const valor of VALORES) valores[valor] = acotar(extraccion.valores?.[valor]);
  const confianza = acotar(extraccion.confianza);
  if (confianza < UMBRAL_CONFIANZA) return { ok: false, motivo: "sin_valores" };
  const maximo = Math.max(...VALORES.map((valor) => valores[valor]));
  if (maximo <= 0) return { ok: false, motivo: "sin_valores" };
  const dominantes = VALORES.filter((valor) => valores[valor] >= maximo * DOMINANCIA_RELATIVA).sort(
    (a, b) => valores[b] - valores[a],
  );
  return { ok: true, valores, confianza, dominantes };
}

/**
 * Valida la descripción y extrae el vector de valores de la empresa. Rechaza texto
 * demasiado corto o largo, de entropía fuera de banda, o sin valores reconocibles.
 */
function extraerValores(
  texto: string,
  extractor: ExtractorValores = extractorLexico,
): ResultadoValores {
  const motivo = verificarSanidad(texto);
  if (motivo) return { ok: false, motivo };
  return armarResultado(extractor.extraer(limpiarTexto(texto)));
}

/** Igual que `extraerValores` pero para extractores asíncronos (LLM, embeddings remotos). */
async function extraerValoresAsync(
  texto: string,
  extractor: ExtractorValoresAsync,
): Promise<ResultadoValores> {
  const motivo = verificarSanidad(texto);
  if (motivo) return { ok: false, motivo };
  return armarResultado(await extractor.extraer(limpiarTexto(texto)));
}

export {
  ENTROPIA_MAXIMA,
  ENTROPIA_MINIMA,
  LARGO_MAXIMO,
  LARGO_MINIMO,
  LARGO_MINIMO_ENTROPIA,
  UMBRAL_CONFIANZA,
  entropiaShannon,
  extraerValores,
  extraerValoresAsync,
  extractorLexico,
  type Extraccion,
  type ExtractorValores,
  type ExtractorValoresAsync,
  type MotivoRechazo,
  type ResultadoValores,
};
export default extraerValores;
