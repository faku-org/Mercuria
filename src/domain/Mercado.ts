import Accion from "./Accion";
import type AI from "./AI";
import type Empresa from "./Empresa";

/** Puede adquirir empresas: una empresa o una IA (a través de su empresa matriz). */
type Comprador = Empresa | AI;

/** Prima sobre la capitalización que se paga al adquirir. */
const PRIMA_ADQUISICION = 0.2;

class Mercado {
  cotizaciones: Accion[];

  constructor(cotizaciones: Accion[] = []) {
    this.cotizaciones = cotizaciones;
  }

  /** Cotización de una empresa, si está listada. */
  cotizacionDe(empresa: Empresa): Accion | undefined {
    return this.cotizaciones.find((cotizacion) => cotizacion.empresa === empresa);
  }

  /** Lista (o re-lista) una empresa con su precio y acciones en circulación. */
  listarEmpresa(empresa: Empresa, precio: number, cantidad: number): Accion {
    const existente = this.cotizacionDe(empresa);
    if (existente) {
      existente.cantidad = cantidad;
      existente.cotizar(precio);
      return existente;
    }
    const accion = new Accion(empresa, precio, cantidad);
    this.cotizaciones.push(accion);
    return accion;
  }

  /** Capitalización de una empresa; si no cotiza, cae a su capital contable. */
  capitalizacion(empresa: Empresa): number {
    return this.cotizacionDe(empresa)?.capitalizacion ?? empresa.capital;
  }

  /** Actualiza el precio de una empresa (la fórmula vive en la simulación). */
  cotizar(empresa: Empresa, precio: number): void {
    this.cotizacionDe(empresa)?.cotizar(precio);
  }

  /** Índice de mercado: promedio de los índices normalizados × 100. */
  indice(): number {
    if (this.cotizaciones.length === 0) return 100;
    const suma = this.cotizaciones.reduce((total, cotizacion) => total + cotizacion.indice, 0);
    return Number(((suma / this.cotizaciones.length) * 100).toFixed(4));
  }

  /** Costo de adquirir una empresa: capitalización + prima. */
  costoAdquisicion(objetivo: Empresa): number {
    return Number((this.capitalizacion(objetivo) * (1 + PRIMA_ADQUISICION)).toFixed(2));
  }

  /**
   * Adquiere una empresa: el comprador paga y toma el control.
   * Las IAs pagan con el capital de su empresa matriz y registran la empresa
   * en `ai.empresas`; las empresas la registran en `subsidiarias`.
   */
  adquirir(
    comprador: Comprador,
    objetivo: Empresa,
  ): { ok: boolean; costo: number; motivo?: string } {
    const costo = this.costoAdquisicion(objetivo);
    const pagador = "empresaMatriz" in comprador ? comprador.empresaMatriz : comprador;

    if (objetivo === pagador) {
      return { ok: false, costo, motivo: "No puede adquirirse a sí misma" };
    }
    if (objetivo.controladaPor) {
      return { ok: false, costo, motivo: "Ya pertenece a otro grupo" };
    }
    if (pagador.capital < costo) {
      return { ok: false, costo, motivo: "Capital insuficiente" };
    }

    pagador.capital = Number((pagador.capital - costo).toFixed(2));
    objetivo.controladaPor = comprador;

    if ("empresaMatriz" in comprador) {
      comprador.empresas.push(objetivo);
    } else {
      comprador.subsidiarias.push(objetivo);
    }

    return { ok: true, costo };
  }
}

export { PRIMA_ADQUISICION, type Comprador };
export default Mercado;
