# Polimorfismo

## Requerimientos Minimos

- [ ] Empleado fijo: cobra un sueldo mensual de $50.000.

- [ ] Empleado por hora: cobra según la cantidad de horas trabajadas.

- [ ] Vendedor: cobra un sueldo base más una comisión por ventas.

- [ ] Crea una clase Empleado con un método calcularSueldo().

- [ ] Crea tres clases que hereden de Empleado:

  - [ ] EmpleadoFijo
  - [ ] EmpleadoPorHora
  - [ ] Vendedor

- [ ] En cada clase, sobrescribe calcularSueldo() para realizar el cálculo correspondiente.

- [ ] Crea varios empleados de distintos tipos y guárdalos en un mismo array.

- [ ] Recorre el array y ejecuta calcularSueldo() para cada empleado.

---

## Extras

Estas son funcionalidades que no son requeridas por el proyecto en si, pero agregarlas le da un valor extra al proyecto.

### Naciones

Las naciones son ubicaciones donde existen leyes y estados. Cada nación tiene un nombre, leyes, población, capital y un idioma oficial.

#### Leyes

Las leyes afectan a varios modulos: sueldos, empresas y AI. Cada ley tiene un nombre, una descripción y un efecto. El efecto puede ser positivo o negativo.

#### Estados

Los estados son divisiones de las naciones. Cada estado tiene un nombre, una población, y leyes que afectan a su población. Los estados pueden tener leyes diferentes a las de la nación.

#### Propiedades

Las propiedades son objetos que pueden ser comprados y vendidos por los empleados. Cada propiedad tiene un nombre, un precio, una ubicación y un dueño.

Son afectadas por las leyes de la nación y del estado donde se encuentran. Por ejemplo, una ley puede afectar el precio de las propiedades o la cantidad de propiedades que un empleado puede tener.

## AI

La AI se refleja en este contexto como la capacidad que tiene una empresa de automatizar trabajo, y de tomar decisiones basadas en datos. La AI puede afectar a los empleados, ya que puede reemplazar algunos trabajos, o mejorar la eficiencia de otros.

La IA puede actuar como una entidad total, por lo que puede tener propiedades, empleados y empresas. La IA puede tener un sueldo, y puede ser afectada por las leyes de la nación y del estado donde se encuentra. A diferencia de los empleados, la IA no tiene un jefe, ya que es una entidad total, y tampoco debe pagar sueldos ya que unicamente tiene agentes.

### Agentes

Los agentes son entidades subordinadas de la IA, deben estar asignados a un sector, no cobran sueldo pero si tienen un costo de uso en base a su productividad y el modelo que se ejecute.

## Sueldo

El sueldo es la remuneracion que recibe el empleado/jefe por su trabajo. El sueldo puede ser fijo o variable, y puede estar afectado por las leyes de la nación y del estado donde se encuentra el empleado/jefe.

## Empresa

Es la entidad legal que permite tener empleados y propiedades. Puede tener o no una IA a su cargo, pero las AIs siempre deben haber sido creadas por una empresa originalmente.

Las empresas se manejan por orden jeraquico, por lo que tienen jefes y empleados. Estan sujetos a las leyes de la nación y del estado donde se encuentran, y pueden tener propiedades.
