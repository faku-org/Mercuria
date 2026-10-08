// Esquema GraphQL: un único endpoint /graphql con queries y mutations.
// Los resolvers delegan en `mundo.ts` (el estado vive ahí).

import { createSchema } from "graphql-yoga";
import {
  adquirirEmpresa,
  adquirirEmpresaUsuario,
  ajustarProductividad,
  avanzar,
  comprarPropiedad,
  crearAgente,
  crearEmpleado,
  cerrarSesion,
  economiaDto,
  eventosDesde,
  fundarEmpresa,
  leyPorId,
  listaEmpresas,
  loginUsuario,
  mercadoDto,
  mundoDto,
  prediccionDto,
  registrarUsuario,
  reiniciar,
  resumenActual,
  sesionDeToken,
  toggleLey,
  usuarioActual,
  type NuevoAgente,
  type NuevoEmpleado,
} from "./mundo";
import {
  ajustar as ajustarSimulacion,
  estado as estadoSimulacion,
  iniciar as iniciarSimulacion,
  pausar as pausarSimulacion,
} from "./reloj";

const typeDefs = /* GraphQL */ `
  type Ley {
    id: ID!
    nombre: String!
    descripcion: String!
    objetivo: String!
    efecto: String!
    magnitud: Float!
    alcance: String!
    activa: Boolean!
    limite: Int
    afecta: [String!]!
  }

  type Nacion {
    nombre: String!
    id: ID!
    iniciales: String!
    capital: String!
    idioma: String!
    poblacion: Float!
    leyes: [Ley!]!
  }

  type Estado {
    nombre: String!
    id: ID!
    iniciales: String!
    capital: String!
    idioma: String!
    poblacion: Float!
    nacion: String!
    leyes: [Ley!]!
  }

  type Empleado {
    id: Int!
    nombre: String!
    tipo: String!
    tipoSueldo: String!
    sueldoBase: Float!
    factorLeyes: Float!
    factorProductividad: Float!
    sueldoFinal: Float!
    empresa: String!
  }

  type Propiedad {
    id: ID!
    nombre: String!
    precio: Float!
    precioConLeyes: Float!
    nacion: String!
    estado: String
    duenio: String
  }

  type Empresa {
    nombre: String!
    id: Int!
    capital: Float!
    productividad: Float!
    acciones: Float!
    intensidadEmision: Float!
    nacion: String
    estado: String
    jefe: String
    ai: String
    capitalizacion: Float!
    precioAccion: Float
    variacion: Float
    valorContable: Float!
    aportePib: Float!
    esControlada: Boolean!
    controladaPor: String
    duenio: String
    esDeUsuario: Boolean!
    subsidiarias: [String!]!
    empleados: [Empleado!]!
    propiedades: [Propiedad!]!
    nominaTotal: Float!
  }

  type Agente {
    id: ID!
    nombre: String!
    modelo: String!
    sector: String!
    productividad: Float!
    costoUso: Float!
  }

  type AI {
    id: ID!
    nombre: String!
    modelo: String!
    productividad: Float!
    empresaMatriz: String!
    asi: Boolean!
    rogue: Boolean!
    sueldoBase: Float!
    sueldoFinal: Float!
    empresas: [String!]!
    agentes: [Agente!]!
  }

  type Recurso {
    id: ID!
    nombre: String!
    tipo: String!
    unidad: String!
    disponibilidad: Float!
    escasez: Float!
    precio: Float!
  }

  type Ambiente {
    contaminacion: Float!
    calidadAire: Float!
    temperatura: Float!
    biodiversidad: Float!
    impacto: Float!
  }

  type PuntoEconomico {
    periodo: Int!
    pib: Float!
    productividadGlobal: Float!
    contaminacion: Float!
    indiceMercado: Float!
  }

  type EstadoSimulacion {
    corriendo: Boolean!
    intervaloMs: Int!
    periodosPorTick: Int!
    ticks: Int!
  }

  type Prediccion {
    periodos: Int!
    periodoInicial: Int!
    puntos: [PuntoEconomico!]!
    pibFinal: Float!
    productividadFinal: Float!
    indiceFinal: Float!
  }

  type Usuario {
    handle: String!
    nombre: String!
    creadoEn: String!
    ultimoVisto: Int!
    empresas: [String!]!
  }

  type Sesion {
    token: String!
    usuario: Usuario!
  }

  type Evento {
    id: Int!
    periodo: Int!
    tipo: String!
    descripcion: String!
    handle: String
    empresa: String
  }

  type Resumen {
    desde: Int!
    hasta: Int!
    periodos: Int!
    pibInicio: Float!
    pibFin: Float!
    productividadInicio: Float!
    productividadFin: Float!
    contaminacionInicio: Float!
    contaminacionFin: Float!
    indiceInicio: Float!
    indiceFin: Float!
    empresas: [Empresa!]!
    eventos: [Evento!]!
  }

  type Economia {
    periodo: Int!
    pibGlobal: Float!
    pibAnterior: Float!
    crecimiento: Float!
    productividadGlobal: Float!
    disponibilidadMedia: Float!
    factorRecursos: Float!
    ambiente: Ambiente!
    recursos: [Recurso!]!
    historico: [PuntoEconomico!]!
  }

  type Cotizacion {
    empresa: String!
    precio: Float!
    precioAnterior: Float!
    cantidad: Float!
    capitalizacion: Float!
    variacion: Float!
    indice: Float!
  }

  type Mercado {
    indice: Float!
    cotizaciones: [Cotizacion!]!
  }

  type LineaNomina {
    id: Int!
    nombre: String!
    tipo: String!
    tipoSueldo: String!
    sueldoBase: Float!
    factorLeyes: Float!
    factorProductividad: Float!
    sueldoFinal: Float!
  }

  type Nomina {
    lineas: [LineaNomina!]!
    totalBase: Float!
    totalFinal: Float!
    productividadGlobal: Float!
  }

  type ResumenLeyes {
    total: Int!
    activas: Int!
    sueldo: Float!
    empresa: Float!
    propiedad: Float!
    ai: Float!
  }

  type Mundo {
    generado: String!
    naciones: [Nacion!]!
    estados: [Estado!]!
    leyes: [Ley!]!
    resumenLeyes: ResumenLeyes!
    empresas: [Empresa!]!
    empleados: [Empleado!]!
    nomina: Nomina!
    propiedades: [Propiedad!]!
    ais: [AI!]!
    economia: Economia!
    mercado: Mercado!
  }

  type Resultado {
    ok: Boolean!
    motivo: String
    detalle: String
    costo: Float
  }

  input NuevoEmpleadoInput {
    tipo: String
    nombre: String
    horasTrabajadas: Float
    tarifaPorHora: Float
    sueldoBase: Float
    ventas: Float
    porcentajeComision: Float
    sueldo: Float
  }

  input NuevoAgenteInput {
    nombre: String
    modelo: String
    sector: String
    productividad: Float
  }

  type Query {
    mundo: Mundo!
    economia: Economia!
    mercado: Mercado!
    recursos: [Recurso!]!
    empresas: [Empresa!]!
    empleados: [Empleado!]!
    naciones: [Nacion!]!
    estados: [Estado!]!
    leyes: [Ley!]!
    resumenLeyes: ResumenLeyes!
    ais: [AI!]!
    nomina: Nomina!
    propiedades: [Propiedad!]!
    estadoSimulacion: EstadoSimulacion!
    predecir(periodos: Int): Prediccion!
    yo: Usuario
    eventos(desde: Int): [Evento!]!
    resumen: Resumen
  }

  type Mutation {
    avanzarPeriodo(periodos: Int): Economia!
    ajustarProductividad(empresa: String!, valor: Float!): Resultado!
    adquirirEmpresa(objetivo: String!, porIA: Boolean): Resultado!
    toggleLey(id: ID!): Resultado!
    crearEmpleado(input: NuevoEmpleadoInput): Resultado!
    crearAgente(input: NuevoAgenteInput): Resultado!
    comprarPropiedad(id: ID!): Resultado!
    reiniciar: Mundo!
    iniciarSimulacion(intervaloMs: Int, periodosPorTick: Int): EstadoSimulacion!
    pausarSimulacion: EstadoSimulacion!
    ajustarSimulacion(intervaloMs: Int, periodosPorTick: Int): EstadoSimulacion!
    registrar(handle: String!, pin: String!, nombre: String): Sesion!
    login(handle: String!, pin: String!): Sesion!
    logout: Boolean!
    fundarEmpresa(nombre: String!, capitalInicial: Float): Empresa!
    adquirirComoUsuario(objetivo: String!, comprador: String): Resultado!
  }
`;

/** Contexto de GraphQL: el token de sesión que llega por header. */
interface Contexto {
  token: string | null;
}

const resolvers = {
  Query: {
    mundo: () => mundoDto(),
    economia: () => economiaDto(),
    mercado: () => mercadoDto(),
    recursos: () => economiaDto().recursos,
    empresas: () => listaEmpresas(),
    empleados: () => mundoDto().empleados,
    naciones: () => mundoDto().naciones,
    estados: () => mundoDto().estados,
    leyes: () => mundoDto().leyes,
    resumenLeyes: () => mundoDto().resumenLeyes,
    ais: () => mundoDto().ais,
    nomina: () => mundoDto().nomina,
    propiedades: () => mundoDto().propiedades,
    estadoSimulacion: () => estadoSimulacion(),
    predecir: (_raiz: unknown, args: { periodos?: number }) => prediccionDto(args.periodos ?? 12),
    yo: (_raiz: unknown, _args: unknown, ctx: Contexto) => usuarioActual(ctx.token),
    eventos: (_raiz: unknown, args: { desde?: number }) => eventosDesde(args.desde ?? 0),
    resumen: (_raiz: unknown, _args: unknown, ctx: Contexto) => resumenActual(ctx.token),
  },

  Mutation: {
    avanzarPeriodo: (_raiz: unknown, args: { periodos?: number }) => avanzar(args.periodos ?? 1),

    ajustarProductividad: (_raiz: unknown, args: { empresa: string; valor: number }) => {
      const empresa = ajustarProductividad(args.empresa, args.valor);
      if (!empresa) return { ok: false, motivo: "Empresa inexistente" };
      return { ok: true, detalle: `${empresa.nombre} → productividad ${empresa.productividad}` };
    },

    adquirirEmpresa: (_raiz: unknown, args: { objetivo: string; porIA?: boolean }) => {
      const resultado = adquirirEmpresa(args.objetivo, args.porIA ?? false);
      return {
        ok: resultado.ok,
        motivo: resultado.motivo ?? null,
        costo: resultado.costo,
        detalle: resultado.ok
          ? `${resultado.comprador} adquirió ${resultado.objetivo} por ${resultado.costo}`
          : null,
      };
    },

    toggleLey: (_raiz: unknown, args: { id: string }) => {
      const ley = toggleLey(args.id);
      if (!ley) return { ok: false, motivo: "Ley inexistente" };
      const dto = leyPorId(ley.id);
      return {
        ok: true,
        detalle: `${ley.nombre} ${ley.activa ? "activada" : "desactivada"}`,
        costo: null,
        motivo: null,
        id: dto?.id,
      };
    },

    crearEmpleado: (_raiz: unknown, args: { input?: NuevoEmpleado }) => {
      const empleado = crearEmpleado(args.input ?? {});
      return { ok: true, detalle: `Empleado ${empleado.nombre} (#${empleado.id}) creado` };
    },

    crearAgente: (_raiz: unknown, args: { input?: NuevoAgente }) => {
      const agente = crearAgente(args.input ?? {});
      return { ok: true, detalle: `Agente ${agente.nombre} (${agente.id}) creado` };
    },

    comprarPropiedad: (_raiz: unknown, args: { id: string }) => {
      const resultado = comprarPropiedad(args.id);
      return { ok: resultado.ok, motivo: resultado.motivo ?? null };
    },

    reiniciar: () => {
      reiniciar();
      return mundoDto();
    },

    iniciarSimulacion: (_raiz: unknown, args: { intervaloMs?: number; periodosPorTick?: number }) =>
      iniciarSimulacion(args.intervaloMs, args.periodosPorTick),

    pausarSimulacion: () => pausarSimulacion(),

    ajustarSimulacion: (_raiz: unknown, args: { intervaloMs?: number; periodosPorTick?: number }) =>
      ajustarSimulacion(args.intervaloMs, args.periodosPorTick),

    registrar: (
      _raiz: unknown,
      args: { handle: string; pin: string; nombre?: string },
    ) => registrarUsuario(args.handle, args.pin, args.nombre),

    login: (_raiz: unknown, args: { handle: string; pin: string }) =>
      loginUsuario(args.handle, args.pin),

    logout: (_raiz: unknown, _args: unknown, ctx: Contexto) => {
      cerrarSesion(ctx.token);
      return true;
    },

    fundarEmpresa: (
      _raiz: unknown,
      args: { nombre: string; capitalInicial?: number },
      ctx: Contexto,
    ) => {
      const usuario = sesionDeToken(ctx.token);
      if (!usuario) throw new Error("Iniciá sesión para fundar una empresa.");
      return fundarEmpresa(usuario, args.nombre, args.capitalInicial ?? 1_000_000);
    },

    adquirirComoUsuario: (
      _raiz: unknown,
      args: { objetivo: string; comprador?: string },
      ctx: Contexto,
    ) => {
      const usuario = sesionDeToken(ctx.token);
      if (!usuario) throw new Error("Iniciá sesión para adquirir una empresa.");
      const resultado = adquirirEmpresaUsuario(usuario, args.objetivo, args.comprador);
      return {
        ok: resultado.ok,
        motivo: resultado.motivo ?? null,
        costo: resultado.costo,
        detalle: resultado.ok ? `${resultado.comprador} adquirió ${resultado.objetivo}` : null,
      };
    },
  },
};

const schema = createSchema({ typeDefs, resolvers });

export { schema, typeDefs };
export default schema;
