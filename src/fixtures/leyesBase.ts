import Ley from "../domain/Ley";
import LeyEstatal from "../domain/LeyEstatal";
import { california } from "./estadosBase";
import { nacionPrincipal, nacionSecundaria } from "./nacionesBase";

// Leyes nacionales.
const proteccionDatos = new Ley(
  "Ley de Protección de Datos",
  "Regula la recopilación, almacenamiento y uso de datos personales.",
  nacionPrincipal,
  { objetivo: "empresa", efecto: "negativo", magnitud: 0.05, activa: true },
);

const propiedadIntelectual = new Ley(
  "Ley de Propiedad Intelectual",
  "Protege los derechos de autor y la propiedad intelectual.",
  nacionPrincipal,
  { objetivo: "propiedad", efecto: "positivo", magnitud: 0.08, activa: true },
);

const seguridadLaboral = new Ley(
  "Ley de Seguridad Laboral",
  "Establece normas para garantizar la seguridad y salud en el trabajo.",
  nacionPrincipal,
  { objetivo: "sueldo", efecto: "positivo", magnitud: 0.1, activa: true },
);

const fomentoIA = new Ley(
  "Ley de Fomento a la IA",
  "Subvenciona el uso de IA, bajando su costo operativo.",
  nacionPrincipal,
  { objetivo: "ai", efecto: "negativo", magnitud: 0.2, activa: true },
);

const ajusteFiscal = new Ley(
  "Ley de Ajuste Fiscal",
  "Grava los sueldos para financiar el gasto público.",
  nacionSecundaria,
  { objetivo: "sueldo", efecto: "negativo", magnitud: 0.03, activa: true },
);

// Ley estatal: tiene prioridad sobre la nacional para su objetivo (propiedad).
const viviendaCalifornia = new LeyEstatal(
  "Ley de Vivienda de California",
  "Desalienta la concentración de propiedades con un recargo y un cupo.",
  california,
  { objetivo: "propiedad", efecto: "negativo", magnitud: 0.15, limite: 3, activa: true },
);

// Ley de alcance global: aplica a todas las naciones. No se registra en ninguna
// nación para no contarse dos veces; se resuelve vía `factorLeyesGlobales`.
const marcoGlobalDatos = new Ley(
  "Marco Global de Datos",
  "Estándar internacional que encarece el tratamiento de datos para las empresas.",
  nacionPrincipal,
  { objetivo: "empresa", efecto: "negativo", magnitud: 0.02, alcance: "global", activa: true },
);

// Registro de leyes en sus naciones y estados.
nacionPrincipal.registrarLey(proteccionDatos);
nacionPrincipal.registrarLey(propiedadIntelectual);
nacionPrincipal.registrarLey(seguridadLaboral);
nacionPrincipal.registrarLey(fomentoIA);
nacionSecundaria.registrarLey(ajusteFiscal);
california.registrarLey(viviendaCalifornia);

const leyes: Ley[] = [
  proteccionDatos,
  propiedadIntelectual,
  seguridadLaboral,
  fomentoIA,
  ajusteFiscal,
  viviendaCalifornia,
  marcoGlobalDatos,
];

const leyesGlobales: Ley[] = [marcoGlobalDatos];

export { leyesGlobales, marcoGlobalDatos, viviendaCalifornia };
export default leyes;
