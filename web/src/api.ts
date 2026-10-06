import type { Mercado, Mundo, Resultado } from "./types";

const ENDPOINT = "/graphql";

interface RespuestaGraphQL<T> {
  data?: T;
  errors?: { message: string }[];
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const respuesta = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
