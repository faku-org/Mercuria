/** Naturaleza del sueldo: fijo (igual todos los períodos) o variable (según el trabajo). */
type TipoSueldo = "fijo" | "variable";

class Sueldo {
  monto: number;
  deduce: boolean;
  tipo: TipoSueldo;

  constructor(monto: number, deduce: boolean = false, tipo: TipoSueldo = "fijo") {
    this.monto = monto;
    this.deduce = deduce;
    this.tipo = tipo;
  }

  /** Devuelve un nuevo Sueldo con el factor de leyes aplicado (0.1 = +10%). */
  conLeyes(factor: number): Sueldo {
    const monto = Number((this.monto * (1 + factor)).toFixed(2));
    return new Sueldo(monto, this.deduce, this.tipo);
  }
}

export { type TipoSueldo };
export default Sueldo;
