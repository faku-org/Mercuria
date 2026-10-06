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
}

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
  }

  /** Lugar fiscal de la empresa: el estado si lo hay, si no la nación. */
  get ubicacion(): Nacion | undefined {
    return this.estado ?? this.nacion;
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

export { type OpcionesEmpresa };
export default Empresa;
