import AI from "./AI";
import type Empleado from "./Empleado";
import type Estado from "./Estado";
import type Jefe from "./Jefe";
import type Ley from "./Ley";
import type { ObjetivoLey } from "./Ley";
import { factorLeyesGlobales } from "./Ley";
import type Nacion from "./Nacion";
import type Propiedad from "./Propiedad";

interface OpcionesEmpresa {
  nacion?: Nacion;
  estado?: Estado;
  jefe?: Jefe;
  /** Nivel de productividad (0–2; 1 = base). */
  productividad?: number;
  /** Techo estructural de productividad: es a lo que tiende la productividad real. */
  capacidad?: number;
  /** Acciones en circulación (para el mercado). */
  acciones?: number;
  /** Contaminación emitida por unidad de producción. */
  intensidadEmision?: number;
}

/** Techo de productividad de una empresa. */
const PRODUCTIVIDAD_MAXIMA = 2;

class Empresa {
  nombre: string;
  id: number;
  empleados: Empleado[];
  capital: number;
  propiedades: Propiedad[];
  nacion?: Nacion;
  estado?: Estado;
  jefe?: Jefe;
  ai?: AI;
  /** Nivel de productividad: mueve su producción, su PIB y su cotización. */
  productividad: number;
  /** Techo estructural: la productividad converge hacia `capacidad × entorno`. */
  capacidad: number;
  /** Acciones en circulación. */
  acciones: number;
  /** Contaminación por unidad de producción. */
  intensidadEmision: number;
  /** Empresas que esta empresa controla. */
  subsidiarias: Empresa[];
  /** Quién la controla, si fue adquirida. */
  controladaPor: Empresa | AI | null;

  constructor(
    nombre: string,
    id: number,
    empleados: Empleado[] = [],
    capital: number = 0,
    propiedades: Propiedad[] = [],
    opciones: OpcionesEmpresa = {},
  ) {
    this.nombre = nombre;
    this.id = id;
    this.empleados = empleados;
    this.capital = capital;
    this.propiedades = propiedades;
    this.nacion = opciones.nacion;
    this.estado = opciones.estado;
    this.jefe = opciones.jefe;
    this.productividad = opciones.productividad ?? 1;
    this.capacidad = opciones.capacidad ?? opciones.productividad ?? 1;
    this.acciones = opciones.acciones ?? 1_000_000;
    this.intensidadEmision = opciones.intensidadEmision ?? 0.5;
    this.subsidiarias = [];
    this.controladaPor = null;
  }

  /** Lugar fiscal de la empresa: el estado si lo hay, si no la nación. */
  get ubicacion(): Nacion | undefined {
    return this.estado ?? this.nacion;
  }

  /** ¿La empresa pertenece a un grupo (empresa o IA)? */
  get esControlada(): boolean {
    return this.controladaPor !== null;
  }

  /**
   * Factor de leyes que aplica a la empresa para un objetivo: las del estado
   * (o nación) donde opera más las globales vigentes.
   */
  factorLeyes(objetivo: ObjetivoLey, leyesGlobales: Ley[] = []): number {
    const local = this.estado
      ? this.estado.factorLeyes(objetivo)
      : this.nacion?.factorLeyes(objetivo);
    return (local ?? 0) + factorLeyesGlobales(leyesGlobales, objetivo);
  }

  /** Producción del período: capital × productividad × recursos × ambiente. */
  produccion(factorRecursos: number, impactoAmbiental: number): number {
    const bruta = this.capital * this.productividad * factorRecursos * (1 - impactoAmbiental);
    return Number(Math.max(0, bruta).toFixed(2));
  }

  /** Ajusta la productividad (acotada a [0, 2]). */
  ajustarProductividad(valor: number): void {
    this.productividad = Number(Math.min(PRODUCTIVIDAD_MAXIMA, Math.max(0, valor)).toFixed(4));
  }

  /** Mueve la productividad por un delta (evolución del período). */
  variarProductividad(delta: number): void {
    this.ajustarProductividad(this.productividad + delta);
  }

  /** Valor contable: capital + propiedades + valor de las subsidiarias. */
  valorContable(): number {
    const propiedades = this.propiedades.reduce(
      (total, propiedad) => total + propiedad.precioConLeyes(),
      0,
    );
    const hijas = this.subsidiarias.reduce(
      (total, subsidiaria) => total + subsidiaria.valorContable(),
      0,
    );
    return Number((this.capital + propiedades + hijas).toFixed(2));
  }

  /** Incorpora a un empleado y le asigna esta empresa. */
  contratar(empleado: Empleado): void {
    empleado.empresa = this;
    if (!this.empleados.includes(empleado)) {
      this.empleados.push(empleado);
    }
  }

  /** Da de baja a un empleado de la plantilla. */
  despedir(empleado: Empleado): void {
    this.empleados = this.empleados.filter((contratado) => contratado !== empleado);
  }

  /** Designa al jefe y lo registra en la plantilla. */
  designarJefe(jefe: Jefe): void {
    this.jefe = jefe;
    this.contratar(jefe);
  }

  /** Costo de la nómina completa (sueldos base). */
  nominaTotal(): number {
    return this.empleados.reduce((total, empleado) => total + empleado.calcularSueldo(), 0);
  }

  /** ¿Puede adquirir otra propiedad sin pasarse del cupo? */
  puedeAdquirir(limite: number = Number.POSITIVE_INFINITY): boolean {
    return this.propiedades.length < limite;
  }

  /** Compra una propiedad: paga el precio con leyes y toma el título. */
  comprarPropiedad(propiedad: Propiedad): boolean {
    const precio = propiedad.precioConLeyes();
    if (this.capital < precio) return false;
    this.capital -= precio;
    propiedad.vender(this);
    this.propiedades.push(propiedad);
    return true;
  }

  /** Vende una propiedad propia y cobra. */
  venderPropiedad(propiedad: Propiedad, precio: number = propiedad.precioConLeyes()): boolean {
    if (!this.propiedades.includes(propiedad)) return false;
    this.capital += precio;
    this.propiedades = this.propiedades.filter((propia) => propia !== propiedad);
    propiedad.vender(null);
    return true;
  }

  /** Crea una AI a partir de la empresa y la vincula (toda AI nace de una empresa). */
  crearAI(nombre: string, modelo: string, sueldoBase: number = 0): AI {
    const ai = new AI(nombre, modelo, this, sueldoBase);
    this.vincularAI(ai);
    return ai;
  }

  /** Vincula la empresa con su AI (toda AI nace de una empresa). */
  vincularAI(ai: AI): void {
    this.ai = ai;
  }
}

export { PRODUCTIVIDAD_MAXIMA, type OpcionesEmpresa };
export default Empresa;
