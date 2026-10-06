import type {
  EstadoSimulacion,
  Evento,
  Mercado,
  Mundo,
  Prediccion,
  Resumen,
  Resultado,
  Sesion,
  UsuarioPerfil,
} from "./types";

const ENDPOINT = "/graphql";
const CLAVE_TOKEN = "polimorfismo.token";

interface RespuestaGraphQL<T> {
  data?: T;
  errors?: { message: string }[];
}

/** Token de sesión guardado en el navegador (o `null`). */
export function tokenGuardado(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

/** Guarda el token de sesión. */
export function guardarToken(token: string): void {
  try {
    localStorage.setItem(CLAVE_TOKEN, token);
  } catch {
    // Modo privado: la sesión queda solo en memoria.
  }
}

/** Borra el token de sesión. */
export function borrarToken(): void {
  try {
    localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Nada.
  }
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenGuardado();
  if (token) headers.Authorization = `Bearer ${token}`;

  const respuesta = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const cuerpo = (await respuesta.json()) as RespuestaGraphQL<T>;
  if (cuerpo.errors?.length) {
    throw new Error(cuerpo.errors.map((error) => error.message).join("; "));
  }
  if (!cuerpo.data) throw new Error("Respuesta GraphQL sin datos");
  return cuerpo.data;
}

const MUNDO_QUERY = `
  query Mundo {
    naciones { nombre id iniciales capital idioma poblacion
      leyes { id nombre descripcion objetivo efecto magnitud alcance activa limite afecta } }
    estados { nombre id nacion
      leyes { id nombre descripcion objetivo efecto magnitud alcance activa limite afecta } }
    leyes { id nombre descripcion objetivo efecto magnitud alcance activa limite afecta }
    resumenLeyes { total activas sueldo empresa propiedad ai }
    empresas {
      nombre id capital productividad acciones intensidadEmision
      nacion estado jefe ai
      capitalizacion precioAccion variacion valorContable aportePib
      esControlada controladaPor subsidiarias nominaTotal
      empleados { id nombre tipo tipoSueldo sueldoBase factorLeyes factorProductividad sueldoFinal }
      propiedades { id nombre precio precioConLeyes nacion estado duenio }
    }
    empleados {
      id nombre tipo tipoSueldo sueldoBase factorLeyes factorProductividad sueldoFinal empresa
    }
    nomina {
      lineas { id nombre tipo tipoSueldo sueldoBase factorLeyes factorProductividad sueldoFinal }
      totalBase totalFinal productividadGlobal
    }
    propiedades { id nombre precio precioConLeyes nacion estado duenio }
    ais {
      id nombre modelo productividad empresaMatriz asi rogue sueldoBase sueldoFinal empresas
      agentes { id nombre modelo sector productividad costoUso }
    }
    economia {
      periodo pibGlobal pibAnterior crecimiento productividadGlobal
      disponibilidadMedia factorRecursos
      ambiente { contaminacion calidadAire temperatura biodiversidad impacto }
      recursos { id nombre tipo unidad disponibilidad escasez precio }
      historico { periodo pib productividadGlobal contaminacion indiceMercado }
    }
    mercado {
      indice
      cotizaciones { empresa precio precioAnterior cantidad capitalizacion variacion indice }
    }
  }
`;

export async function getMundo(): Promise<Mundo> {
  // La query pide todos los campos de `Mundo` en la raíz del esquema.
  return await gql<Mundo>(MUNDO_QUERY);
}

export async function getMercado(): Promise<Mercado> {
  const data = await gql<{ mercado: Mercado }>(`query {
    mercado { indice cotizaciones { empresa precio precioAnterior cantidad capitalizacion variacion indice } }
  }`);
  return data.mercado;
}

export async function avanzarPeriodo(periodos: number): Promise<void> {
  await gql(`mutation ($periodos: Int) { avanzarPeriodo(periodos: $periodos) { periodo } }`, {
    periodos,
  });
}

export async function ajustarProductividad(empresa: string, valor: number): Promise<Resultado> {
  const data = await gql<{ ajustarProductividad: Resultado }>(
    `mutation ($empresa: String!, $valor: Float!) {
      ajustarProductividad(empresa: $empresa, valor: $valor) { ok motivo detalle }
    }`,
    { empresa, valor },
  );
  return data.ajustarProductividad;
}

export async function adquirirEmpresa(objetivo: string, porIA: boolean): Promise<Resultado> {
  const data = await gql<{ adquirirEmpresa: Resultado }>(
    `mutation ($objetivo: String!, $porIA: Boolean) {
      adquirirEmpresa(objetivo: $objetivo, porIA: $porIA) { ok motivo detalle costo }
    }`,
    { objetivo, porIA },
  );
  return data.adquirirEmpresa;
}

export async function toggleLey(id: string): Promise<Resultado> {
  const data = await gql<{ toggleLey: Resultado }>(
    `mutation ($id: ID!) { toggleLey(id: $id) { ok motivo detalle } }`,
    { id },
  );
  return data.toggleLey;
}

export async function crearEmpleado(input: Record<string, unknown>): Promise<Resultado> {
  const data = await gql<{ crearEmpleado: Resultado }>(
    `mutation ($input: NuevoEmpleadoInput) { crearEmpleado(input: $input) { ok motivo detalle } }`,
    { input },
  );
  return data.crearEmpleado;
}

export async function crearAgente(input: Record<string, unknown>): Promise<Resultado> {
  const data = await gql<{ crearAgente: Resultado }>(
    `mutation ($input: NuevoAgenteInput) { crearAgente(input: $input) { ok motivo detalle } }`,
    { input },
  );
  return data.crearAgente;
}

export async function comprarPropiedad(id: string): Promise<Resultado> {
  const data = await gql<{ comprarPropiedad: Resultado }>(
    `mutation ($id: ID!) { comprarPropiedad(id: $id) { ok motivo detalle } }`,
    { id },
  );
  return data.comprarPropiedad;
}

export async function reiniciar(): Promise<void> {
  await gql(`mutation { reiniciar { generado } }`);
}

// --- Simulación en vivo -------------------------------------------------------

const CAMPOS_SIMULACION = "corriendo intervaloMs periodosPorTick ticks";

export async function getEstadoSimulacion(): Promise<EstadoSimulacion> {
  const data = await gql<{ estadoSimulacion: EstadoSimulacion }>(
    `query { estadoSimulacion { ${CAMPOS_SIMULACION} } }`,
  );
  return data.estadoSimulacion;
}

export async function iniciarSimulacion(
  intervaloMs?: number,
  periodosPorTick?: number,
): Promise<EstadoSimulacion> {
  const data = await gql<{ iniciarSimulacion: EstadoSimulacion }>(
    `mutation ($intervaloMs: Int, $periodosPorTick: Int) {
      iniciarSimulacion(intervaloMs: $intervaloMs, periodosPorTick: $periodosPorTick) { ${CAMPOS_SIMULACION} }
    }`,
    { intervaloMs, periodosPorTick },
  );
  return data.iniciarSimulacion;
}

export async function pausarSimulacion(): Promise<EstadoSimulacion> {
  const data = await gql<{ pausarSimulacion: EstadoSimulacion }>(
    `mutation { pausarSimulacion { ${CAMPOS_SIMULACION} } }`,
  );
  return data.pausarSimulacion;
}

export async function ajustarSimulacion(
  intervaloMs?: number,
  periodosPorTick?: number,
): Promise<EstadoSimulacion> {
  const data = await gql<{ ajustarSimulacion: EstadoSimulacion }>(
    `mutation ($intervaloMs: Int, $periodosPorTick: Int) {
      ajustarSimulacion(intervaloMs: $intervaloMs, periodosPorTick: $periodosPorTick) { ${CAMPOS_SIMULACION} }
    }`,
    { intervaloMs, periodosPorTick },
  );
  return data.ajustarSimulacion;
}

export async function getPrediccion(periodos: number): Promise<Prediccion> {
  const data = await gql<{ predecir: Prediccion }>(
    `query ($periodos: Int) {
      predecir(periodos: $periodos) {
        periodos periodoInicial pibFinal productividadFinal indiceFinal
        puntos { periodo pib productividadGlobal contaminacion indiceMercado }
      }
    }`,
    { periodos },
  );
  return data.predecir;
}

/**
 * Abre el stream SSE del mundo y llama a `onMundo` con cada snapshot. Devuelve
 * la función para cerrar la conexión.
 */
export function suscribirMundo(onMundo: (mundo: Mundo) => void): () => void {
  const fuente = new EventSource("/api/stream");
  fuente.onmessage = (evento) => {
    try {
      onMundo(JSON.parse(evento.data) as Mundo);
    } catch {
      // Snapshot inválido: se ignora y se espera el próximo.
    }
  };
  return () => fuente.close();
}

// --- Usuarios y empresas propias ----------------------------------------------

const CAMPOS_USUARIO = "handle nombre creadoEn ultimoVisto empresas";
const CAMPOS_EVENTO = "id periodo tipo descripcion handle empresa";

export async function registrar(handle: string, pin: string, nombre?: string): Promise<Sesion> {
  const data = await gql<{ registrar: Sesion }>(
    `mutation ($handle:String!,$pin:String!,$nombre:String){
      registrar(handle:$handle, pin:$pin, nombre:$nombre) { token usuario { ${CAMPOS_USUARIO} } }
    }`,
    { handle, pin, nombre },
  );
  guardarToken(data.registrar.token);
  return data.registrar;
}

export async function login(handle: string, pin: string): Promise<Sesion> {
  const data = await gql<{ login: Sesion }>(
    `mutation ($handle:String!,$pin:String!){
      login(handle:$handle, pin:$pin) { token usuario { ${CAMPOS_USUARIO} } }
    }`,
    { handle, pin },
  );
  guardarToken(data.login.token);
  return data.login;
}

export async function logout(): Promise<void> {
  try {
    await gql(`mutation { logout }`);
  } finally {
    borrarToken();
  }
}

/** Restaura la sesión a partir del token guardado. */
export async function getYo(): Promise<UsuarioPerfil | null> {
  if (!tokenGuardado()) return null;
  const data = await gql<{ yo: UsuarioPerfil | null }>(`query { yo { ${CAMPOS_USUARIO} } }`);
  return data.yo;
}

export async function fundarEmpresa(
  nombre: string,
  capitalInicial: number,
): Promise<{ nombre: string }> {
  const data = await gql<{ fundarEmpresa: { nombre: string } }>(
    `mutation ($nombre:String!,$capitalInicial:Float){
      fundarEmpresa(nombre:$nombre, capitalInicial:$capitalInicial) { nombre }
    }`,
    { nombre, capitalInicial },
  );
  return data.fundarEmpresa;
}

export async function adquirirComoUsuario(objetivo: string, comprador?: string): Promise<Resultado> {
  const data = await gql<{ adquirirComoUsuario: Resultado }>(
    `mutation ($objetivo:String!,$comprador:String){
      adquirirComoUsuario(objetivo:$objetivo, comprador:$comprador) { ok motivo detalle costo }
    }`,
    { objetivo, comprador },
  );
  return data.adquirirComoUsuario;
}

export async function getResumen(): Promise<Resumen | null> {
  const data = await gql<{ resumen: Resumen | null }>(
    `query {
      resumen {
        desde hasta periodos pibInicio pibFin productividadInicio productividadFin
        contaminacionInicio contaminacionFin indiceInicio indiceFin
        empresas { nombre duenio esDeUsuario capital productividad capitalizacion }
        eventos { ${CAMPOS_EVENTO} }
      }
    }`,
  );
  return data.resumen;
}

export async function getEventos(desde = 0): Promise<Evento[]> {
  const data = await gql<{ eventos: Evento[] }>(
    `query ($desde:Int){ eventos(desde:$desde){ ${CAMPOS_EVENTO} } }`,
    { desde },
  );
  return data.eventos;
}
