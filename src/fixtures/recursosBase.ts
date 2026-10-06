import Recurso from "../domain/Recurso";

const agua = new Recurso("Agua", "agua", "m3", {
  disponibilidad: 1,
  regeneracion: 0.02,
  consumoBase: 1,
  precioBase: 0.5,
});

const electricidad = new Recurso("Electricidad", "electricidad", "kWh", {
  disponibilidad: 1,
  regeneracion: 0.03,
  consumoBase: 1.2,
  precioBase: 0.9,
});

const combustible = new Recurso("Combustible", "combustible", "L", {
  disponibilidad: 0.8,
  regeneracion: 0.01,
  consumoBase: 1.5,
  precioBase: 1.4,
});

const minerales = new Recurso("Minerales", "minerales", "kg", {
  disponibilidad: 0.6,
  regeneracion: 0.005,
  consumoBase: 0.8,
  precioBase: 2.5,
});

const recursos: Recurso[] = [agua, electricidad, combustible, minerales];

export { agua, combustible, electricidad, minerales };
export default recursos;
