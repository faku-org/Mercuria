class Sueldo {
  monto: number;
  deduce: boolean;

  constructor(monto: number, deduce: boolean) {
    this.monto = monto;
    this.deduce = deduce;
  }
}

export default Sueldo;
