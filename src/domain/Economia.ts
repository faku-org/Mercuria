import Ambiente from "./Ambiente";
import type Recurso from "./Recurso";

/** Muestra del estado económico en un período, para graficar. */
interface PuntoEconomico {
  periodo: number;
  pib: number;
  productividadGlobal: number;
  contaminacion: number;
  indiceMercado: number;
}

/** Sistema económico: PIB global, productividad global, recursos y ambiente. */
class Economia {
  pibGlobal: number;
  pibAnterior: number;
  crecimiento: number;
  productividadGlobal: number;
  periodo: number;
  recursos: Recurso[];
  ambiente: Ambiente;
  historico: PuntoEconomico[];

  constructor(recursos: Recurso[] = [], ambiente: Ambiente = new Ambiente()) {
    this.recursos = recursos;
    this.ambiente = ambiente;
    this.pibGlobal = 0;
    this.pibAnterior = 0;
    this.crecimiento = 0;
    this.productividadGlobal = 1;
    this.periodo = 0;
    this.historico = [];
  }

  /** Factor de recursos que multiplica a la producción: Π disponibilidadᵣ^0.5. */
  factorRecursos(): number {
    return this.recursos.reduce((factor, recurso) => factor * recurso.factorProduccion(), 1);
  }

  /** Disponibilidad media de los recursos (1 = normal). */
  disponibilidadMedia(): number {
    if (this.recursos.length === 0) return 1;
    const suma = this.recursos.reduce((total, recurso) => total + recurso.disponibilidad, 0);
    return Number((suma / this.recursos.length).toFixed(6));
  }

  /** Recalcula el PIB a partir de los aportes de cada empresa. */
  recalcularPib(aportes: number[]): void {
    this.pibAnterior = this.pibGlobal;
    this.pibGlobal = Number(aportes.reduce((total, aporte) => total + aporte, 0).toFixed(2));
    this.crecimiento =
      this.pibAnterior === 0 ? 0 : Number((this.pibGlobal / this.pibAnterior - 1).toFixed(6));
  }

  /** Productividad global: promedio ponderado por capital. */
  recalcularProductividadGlobal(empresas: { productividad: number; capital: number }[]): void {
    const capitalTotal = empresas.reduce(
      (total, empresa) => total + Math.max(0, empresa.capital),
      0,
    );
    if (capitalTotal === 0) {
      this.productividadGlobal = 1;
      return;
    }
    const ponderada = empresas.reduce(
      (total, empresa) => total + empresa.productividad * Math.max(0, empresa.capital),
      0,
    );
    this.productividadGlobal = Number((ponderada / capitalTotal).toFixed(6));
  }

  /** Cierra el período: guarda la muestra y avanza el contador. */
  cerrarPeriodo(indiceMercado: number): PuntoEconomico {
    const punto: PuntoEconomico = {
      periodo: this.periodo,
      pib: this.pibGlobal,
      productividadGlobal: this.productividadGlobal,
      contaminacion: Number(this.ambiente.contaminacion.toFixed(4)),
      indiceMercado: Number(indiceMercado.toFixed(2)),
    };
    this.historico.push(punto);
    this.periodo += 1;
    return punto;
  }
}

export { type PuntoEconomico };
export default Economia;
