import { useEffect, type ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  CircleDashed,
  Coins,
  Droplets,
  Globe,
  LineChart,
  Moon,
  Radio,
  Scale,
  Share2,
  Sun,
  User,
  Wallet,
} from "lucide-react";
import { useTema } from "../components/Tema";
import { Badge, Card } from "../components/ui";
import { Simulador } from "./Simulador";

const REPO = "https://github.com/faku-org/Mercuria";

function Seccion({
  id,
  etiqueta,
  titulo,
  intro,
  children,
}: {
  id: string;
  etiqueta: string;
  titulo: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-14 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">{etiqueta}</p>
      <h2 className="mt-2 max-w-3xl text-2xl font-bold sm:text-3xl">{titulo}</h2>
      {intro ? (
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">{intro}</p>
      ) : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Codigo({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-line bg-canvas p-4 font-mono text-[13px] leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

// --- Datos de contenido ------------------------------------------------------

const CARACTERISTICAS = [
  {
    Icono: Wallet,
    titulo: "Sueldos polimórficos",
    texto:
      "Empleado fijo, por hora y vendedor sobrescriben calcularSueldo(). Después se aplican las leyes y la productividad global.",
  },
  {
    Icono: Scale,
    titulo: "Naciones, estados y leyes",
    texto:
      "Cada ley tiene efecto, magnitud y alcance. Una ley estatal tiene prioridad sobre la nacional; una global aplica a todas.",
  },
  {
    Icono: Briefcase,
    titulo: "Empresas con jerarquía",
    texto:
      "Jefes y equipos, propiedades que se compran y se venden, productividad propia y una cotización en el mercado.",
  },
  {
    Icono: Bot,
    titulo: "IA y agentes",
    texto:
      "La IA es una entidad total creada por una empresa. Sus agentes no cobran sueldo: tienen un costo de uso según el modelo.",
  },
  {
    Icono: LineChart,
    titulo: "Economía y mercado",
    texto:
      "PIB global, productividad ponderada por capital y adquisiciones con una prima del 20% que también pueden hacer las IAs.",
  },
  {
    Icono: Droplets,
    titulo: "Recursos y ambiente",
    texto:
      "Agua, electricidad, combustible y minerales con precio por escasez. La contaminación frena la producción.",
  },
  {
    Icono: Radio,
    titulo: "Simulación en vivo",
    texto:
      "Un reloj en el servidor corre aunque no haya nadie conectado, y todos los clientes ven el mismo mundo por SSE.",
  },
  {
    Icono: User,
    titulo: "Cuentas y empresas propias",
    texto:
      "Registro con handle y PIN, fundación y adquisición de empresas, y un resumen de lo que pasó mientras no estabas.",
  },
  {
    Icono: Share2,
    titulo: "API GraphQL y predicción",
    texto:
      "Todo el mundo se consulta por GraphQL. La predicción corre N períodos sobre una copia, sin tocar el estado real.",
  },
] as const;

const PASOS = [
  { n: 1, titulo: "Produce", formula: "capital × productividad × √recursos × (1 − impacto)" },
  { n: 2, titulo: "Consume y emite", formula: "consumo = consumoBase × producción × 1e-9" },
  { n: 3, titulo: "Regenera", formula: "disponibilidad += regeneración (tope 2)" },
  {
    n: 4,
    titulo: "Converge",
    formula: "Δ productividad = 0,15 × (1,2 × techo × entorno − actual)",
  },
  { n: 5, titulo: "Agrega", formula: "PIB = Σ producción · productividad global ponderada" },
  { n: 6, titulo: "Reprecia", formula: "precio × (1 + 0,5 × Δ PIB + 0,5 × Δ productividad)" },
  { n: 7, titulo: "Registra", formula: "punto en el histórico y período + 1" },
] as const;

const HECHO = [
  "Requisitos mínimos de polimorfismo con tests",
  "Naciones, estados, leyes y propiedades con leyes aplicadas",
  "Empresas con jerarquía, IA y agentes",
  "Modelo económico: productividad, PIB, mercado, recursos y ambiente",
  "API GraphQL, persistencia en SQLite y UI web",
  "Simulación en vivo y autónoma (reloj en el servidor + SSE)",
  "Predicción por simulación aislada",
  "Usuarios, empresas propias y resumen de ausencia",
] as const;

const PLANTEADO = [
  {
    cod: "B",
    titulo: "Empresa realista",
    texto:
      "Sector, objetivo, empleados productivos frente a la plantilla y productividad combinada.",
  },
  {
    cod: "C",
    titulo: "IA con curva",
    texto:
      "Catálogo de modelos que arranca caro y poco productivo, adopción por las empresas y riesgo de IAs rogue.",
  },
  {
    cod: "D",
    titulo: "Empresas estatales",
    texto: "Proveen recursos con disponibilidad objetivo y precio regulado.",
  },
  {
    cod: "E",
    titulo: "Clientes y beneficio",
    texto:
      "Cuota de mercado según la población de la nación; el beneficio alimenta capital, PIB y cotización.",
  },
  {
    cod: "F",
    titulo: "Exposición",
    texto: "GraphQL, persistencia, UI y tests de todo lo anterior.",
  },
] as const;

const LIMITES = [
  "El precio de las acciones sale de una fórmula, no de oferta y demanda.",
  "No hay inflación ni tasas: el PIB es nominal.",
  "Los recursos son independientes: no hay sustitución.",
  "Las leyes afectan sueldos, propiedades y IA, pero todavía no el PIB.",
  "No hay quiebras ni desempleo automáticos.",
  "El ambiente no se regenera dentro del ciclo: la contaminación solo acumula.",
] as const;

// --- Página ------------------------------------------------------------------

function AlternarTema() {
  const { tema, alternar } = useTema();
  const oscuro = tema === "oscuro";
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      {oscuro ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export default function Showcase() {
  useEffect(() => {
    document.title = "Mercuria · Simulación económica orientada a objetos";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Mercuria: un mundo económico simulado con naciones, leyes, empresas, mercado e IA, construido a partir de un ejercicio de polimorfismo.",
      );
  }, []);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2.5" aria-label="Mercuria, inicio">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-300 text-on-accent shadow-sm">
              <Coins size={16} />
            </span>
            <span className="font-display text-base font-bold tracking-tight">Mercuria</span>
          </a>
          <nav
            className="ml-6 hidden items-center gap-5 text-sm text-muted md:flex"
            aria-label="Secciones"
          >
            <a href="#objetivo" className="hover:text-ink">
              A qué apunta
            </a>
            <a href="#caracteristicas" className="hover:text-ink">
              Características
            </a>
            <a href="#simulacion" className="hover:text-ink">
              Simulación
            </a>
            <a href="#estado" className="hover:text-ink">
              Estado
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <AlternarTema />
            <a
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <span>
                <span className="hidden sm:inline">Abrir el </span>
                <span className="sm:hidden">Ir al </span>panel
              </span>
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section className="pb-6 pt-14 sm:pt-24">
          <Badge tono="acento">Simulación económica · TypeScript</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.1] sm:text-6xl">
            Una economía entera, construida con objetos.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Mercuria arrancó como un ejercicio de polimorfismo,{" "}
            <code className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
              Empleado.calcularSueldo()
            </code>
            , y creció hasta un mundo con naciones, leyes, empresas, mercado e IA que sigue
            avanzando aunque nadie lo mire.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#simulacion"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Probar la simulación <ArrowRight size={15} />
            </a>
            <a
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Abrir el panel real
            </a>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {[
              ["10", "vistas en el panel"],
              ["4", "recursos con precio por escasez"],
              ["7", "pasos por período"],
              ["1", "reloj en el servidor, para todos"],
            ].map(([cifra, texto]) => (
              <div key={texto} className="bg-surface p-5">
                <dt className="tabular font-mono text-3xl font-medium text-accent">{cifra}</dt>
                <dd className="mt-1 text-sm text-muted">{texto}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Objetivo */}
        <Seccion
          id="objetivo"
          etiqueta="A qué apunta"
          titulo="Un laboratorio donde leyes, empresas e IA se afectan entre sí."
          intro="No busca ser un modelo económico fiel a la realidad. Busca que cada pieza del dominio influya en las demás de forma legible, para poder ver una decisión propagarse por todo el sistema."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <h3 className="text-base font-semibold">Origen: POO bien hecha</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Herencia y polimorfismo reales, no decorativos. Capas con reglas de dependencia:
                dominio, servicios, servidor y UI, y la UI no importa código del backend.
              </p>
            </Card>
            <Card>
              <h3 className="text-base font-semibold">Ambición: un mundo vivo</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                El sueldo de un empleado depende de las leyes de su estado, de la productividad de
                todas las empresas y, por detrás, de cuánta agua y aire limpio quedan.
              </p>
            </Card>
            <Card>
              <h3 className="text-base font-semibold">Criterio: simple y declarado</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Cada simplificación está escrita en la documentación, junto con el orden en que se
                resolvería para ir a algo serio. Más abajo está la lista de límites.
              </p>
            </Card>
          </div>

          <div className="mt-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold">El punto de partida: polimorfismo</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                El mismo array, el mismo recorrido, tres reglas distintas. Después, la capa de
                dominio suma las leyes y la productividad global sobre ese resultado.
              </p>
              <div className="mt-4">
                <Codigo>
                  {`const equipo: Empleado[] = [
  new EmpleadoFijo("Ana", 1, empresa),
  new EmpleadoPorHora("Beto", 2, empresa, 120, 800),
  new Vendedor("Cami", 3, empresa, 40000, 500000, 3),
];

for (const e of equipo) {
  e.calcularSueldo(); // cada subclase aplica su regla
}`}
                </Codigo>
              </div>
            </div>
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="border-b border-line px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                    Ejemplo ilustrativo
                  </caption>
                  <thead>
                    <tr className="border-b border-line text-xs text-muted">
                      <th scope="col" className="px-5 py-2 font-medium">
                        Clase
                      </th>
                      <th scope="col" className="px-5 py-2 font-medium">
                        Regla
                      </th>
                      <th scope="col" className="px-5 py-2 text-right font-medium">
                        Base
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular font-mono text-xs">
                    <tr className="border-b border-line">
                      <td className="px-5 py-3">EmpleadoFijo</td>
                      <td className="px-5 py-3 text-muted">mensual fijo</td>
                      <td className="px-5 py-3 text-right">$ 50.000</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="px-5 py-3">EmpleadoPorHora</td>
                      <td className="px-5 py-3 text-muted">120 h × $ 800</td>
                      <td className="px-5 py-3 text-right">$ 96.000</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3">Vendedor</td>
                      <td className="px-5 py-3 text-muted">40.000 + 3% de 500.000</td>
                      <td className="px-5 py-3 text-right">$ 55.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="border-t border-line bg-canvas px-5 py-3">
                <p className="font-mono text-xs text-muted">
                  sueldo final = base × (1 + leyes) × productividad global
                </p>
              </div>
            </Card>
          </div>
        </Seccion>

        {/* Características */}
        <Seccion
          id="caracteristicas"
          etiqueta="Características"
          titulo="Lo que ya funciona hoy."
          intro="Todo lo de esta sección está implementado y se puede ver en el panel."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CARACTERISTICAS.map(({ Icono, titulo, texto }) => (
              <li key={titulo}>
                <Card className="h-full">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Icono size={18} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{texto}</p>
                </Card>
              </li>
            ))}
          </ul>
        </Seccion>

        {/* Simulación */}
        <Seccion
          id="simulacion"
          etiqueta="La simulación"
          titulo="Siete pasos por período, y el entorno manda."
          intro="Cada período toda la economía se recalcula en el mismo orden. La producción gasta recursos y ensucia el aire; con menos recursos y peor aire, la productividad baja; con menos productividad, baja el PIB y el precio de las acciones."
        >
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PASOS.map((paso) => (
              <li key={paso.n} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center gap-2">
                  <span className="tabular flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft font-mono text-xs text-accent">
                    {paso.n}
                  </span>
                  <h3 className="text-sm font-semibold">{paso.titulo}</h3>
                </div>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted">
                  {paso.formula}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Probala vos</h3>
                <p className="mt-1 max-w-2xl text-sm text-muted">
                  Es el mismo ciclo del servidor corriendo en tu navegador. Con las tres palancas en
                  ×1 la trayectoria es idéntica a la real: un test lo verifica contra el dominio.
                  Mové las palancas y mirá qué pasa cuando algo escasea.
                </p>
              </div>
            </div>
            <Simulador />
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Globe size={17} className="text-accent" /> En el sistema real
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                <li>
                  El reloj corre en el servidor desde que arranca el proceso (30 s por período por
                  defecto).
                </li>
                <li>
                  Todos los clientes reciben el mismo mundo por{" "}
                  <span className="font-mono text-xs">/api/stream</span>.
                </li>
                <li>Los hechos notables quedan en una bitácora y se resumen cuando volvés.</li>
              </ul>
            </Card>
            <Card>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <LineChart size={17} className="text-accent" /> Predicción aislada
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                <span className="font-mono text-xs">predecir(periodos)</span> clona recursos,
                ambiente, empresas y mercado, corre N períodos sobre la copia y devuelve la serie
                sin tocar el estado real. Es una proyección determinista de la configuración
                vigente, no un pronóstico de shocks.
              </p>
            </Card>
          </div>
        </Seccion>

        {/* Estado */}
        <Seccion
          id="estado"
          etiqueta="Estado del proyecto"
          titulo="Qué está hecho, qué está planteado y qué falta."
          intro="La simulación de arriba es el modelo implementado. Lo que sigue es el plan para volverlo más realista; todavía no existe en el código."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Implementado</h3>
                <Badge tono="positivo">Listo</Badge>
              </div>
              <ul className="space-y-2.5">
                {HECHO.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-positive" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Planteado: modelo realista</h3>
                <Badge>Pendiente</Badge>
              </div>
              <ul className="space-y-3">
                {PLANTEADO.map((item) => (
                  <li key={item.cod} className="flex gap-3 text-sm">
                    <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line font-mono text-xs text-muted">
                      {item.cod}
                    </span>
                    <span>
                      <strong className="font-semibold">{item.titulo}.</strong>{" "}
                      <span className="text-muted">{item.texto}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="mt-4">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <CircleDashed size={17} className="text-muted" /> Límites declarados
            </h3>
            <ul className="mt-3 grid gap-x-8 gap-y-2 text-sm text-muted md:grid-cols-2">
              {LIMITES.map((limite) => (
                <li key={limite} className="flex gap-2.5">
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted"
                    aria-hidden="true"
                  />
                  {limite}
                </li>
              ))}
            </ul>
          </Card>
        </Seccion>

        {/* Arquitectura */}
        <section className="border-t border-line py-14 sm:py-20" aria-labelledby="stack">
          <h2 id="stack" className="text-2xl font-bold">
            Cómo está armado
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              [
                "Dominio",
                "src/domain",
                "Clases del modelo: Empleado, Nacion, Ley, Empresa, AI, Mercado.",
              ],
              [
                "Servicios",
                "src/services",
                "Casos de uso: nómina, leyes, simulación y predicción.",
              ],
              ["Servidor", "src/server", "Elysia, GraphQL, reloj, SSE y SQLite con bun:sqlite."],
              ["Web", "web/", "React 19, Vite y TailwindCSS v4, con gráficos propios en SVG."],
            ].map(([nombre, ruta, texto]) => (
              <div key={nombre} className="rounded-2xl border border-line bg-surface p-4">
                <p className="font-mono text-xs text-accent">{ruta}</p>
                <h3 className="mt-1 text-base font-semibold">{nombre}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{texto}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Bun, TypeScript en modo strict, oxlint y oxfmt. Sin librerías de gráficos ni ORM.
          </p>
        </section>

        {/* Cierre */}
        <section className="mb-16 rounded-3xl border border-line bg-surface p-8 sm:p-12">
          <h2 className="max-w-2xl text-2xl font-bold sm:text-3xl">
            Mirá el mundo real corriendo.
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            El panel muestra el mismo sistema con datos en vivo: mercado, nómina, leyes, empresas e
            IA.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Abrir el panel <ArrowRight size={15} />
            </a>
            <a
              href="/graphql"
              className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-medium transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              GraphQL
            </a>
            <a
              href={REPO}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-medium transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Código en GitHub
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
