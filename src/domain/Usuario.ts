import type Empresa from "./Empresa";

/**
 * Cuenta de un jugador. Se identifica por un `handle` único y se protege con un
 * PIN (guardado como hash). `ultimoVisto` es el período que el usuario vio por
 * última vez, para armarle el resumen de ausencia.
 */
class Usuario {
  handle: string;
  nombre: string;
  hashPin: string;
  creadoEn: string;
  ultimoVisto: number;
  empresas: Empresa[];

  constructor(
    handle: string,
    nombre: string,
    hashPin: string,
    creadoEn: string = new Date().toISOString(),
    ultimoVisto: number = 0,
    empresas: Empresa[] = [],
  ) {
    this.handle = handle;
    this.nombre = nombre;
    this.hashPin = hashPin;
    this.creadoEn = creadoEn;
    this.ultimoVisto = ultimoVisto;
    this.empresas = empresas;
  }

  /** Registra una empresa propia (evita duplicados). */
  agregarEmpresa(empresa: Empresa): void {
    if (!this.empresas.includes(empresa)) this.empresas.push(empresa);
  }

  /** Quita una empresa de la cartera del usuario. */
  quitarEmpresa(empresa: Empresa): void {
    this.empresas = this.empresas.filter((propia) => propia !== empresa);
  }

  /** Datos serializables (sin el hash del PIN). */
  get perfil() {
    return {
      handle: this.handle,
      nombre: this.nombre,
      creadoEn: this.creadoEn,
      ultimoVisto: this.ultimoVisto,
      empresas: this.empresas.map((empresa) => empresa.nombre),
    };
  }
}

/** Normaliza un handle: minúsculas, sin espacios ni símbolos raros. */
function normalizarHandle(texto: string): string {
  return texto.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

/** Un handle válido tiene entre 3 y 20 caracteres alfanuméricos (o guion bajo). */
function handleValido(handle: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(handle);
}

export { normalizarHandle, handleValido };
export default Usuario;
