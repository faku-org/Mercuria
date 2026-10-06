class Persona {
  nombre: string;
  edad: number;
  dni: string;
  fechaNacimiento: Date;
  direccion: string;
  estadoCivil: string;
  empleado: boolean;

  constructor(
    nombre: string,
    edad: number,
    dni: string,
    fechaNacimiento: Date,
    direccion: string,
    estadoCivil: string,
    empleado: boolean,
  ) {
    this.nombre = nombre;
    this.edad = edad;
    this.dni = dni;
    this.fechaNacimiento = fechaNacimiento;
    this.direccion = direccion;
    this.estadoCivil = estadoCivil;
    this.empleado = empleado;
  }
}

export default Persona;
