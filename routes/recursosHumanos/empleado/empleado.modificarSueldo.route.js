const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")
const Puesto = require("../../../models/recursosHumanos/puestos/puesto.model")

module.exports = function ( datos ){
    // Obtener empleado
    return Empleado.findById(datos._id)
    .exec()
    .then((empleado) => encontrarPuesto(empleado, datos))
    .then((d) => crearEventoDeSueldoConComprobacion(d))
}

function crearEventoDeSueldoConComprobacion(d) {
    //Un sueldo no puede superar el maximo del empleado. \
    elSueldoSuperaElMaximoDelEmpleado(d.datos.nuevoSueldo, d.puesto.Maximo)
  
    // Un sueldo no puede estar por debajo del salario base de
    // su puesto actual.
    elSueldoEstaPorDebajoDelSueldoBase(d.datos.nuevoSueldo, d.puesto.sueldoBase)
  
    elSueldoActualEsIgualAlAumento(d.datos.nuevoSueldo, d.empleado.sueldoActual)
  
    const evento = {
      cambiosDeSueldo: {
        sueldAnteriorAlCambio: d.empleado.sueldoActual,
        aumento: d.datos.nuevoSueldo,
        observacion: d.datos.observaciones
      }
    }
  
    //Debemos de crear un evento de actualizacion
    const e = crearHistorialDeEventos(evento)
    d.empleado.eventos.unshift(e)
    d.empleado.sueldoActual = d.datos.nuevoSueldo
  
    return d.empleado.save()
  }
  
  function encontrarPuesto(empleado, datos) {
    if (!empleado) throw "No existe el empleado"
    return new Promise((resolve, reject) => {
      Puesto.findById(empleado.puestoActual)
        .exec()
        .then((puesto) => {
          resolve({
            datos,
            empleado,
            puesto
          })
        })
        .catch((err) => reject(err))
    })
  }
  
  function elSueldoSuperaElMaximoDelEmpleado(nuevoSueldo, sueldoMaximo) {
    if (nuevoSueldo > sueldoMaximo)
      throw "El sueldo supera el maximo del puesto de este empleado"
  }
  
  // Un sueldo no puede estar por debajo del salario base de
  function elSueldoEstaPorDebajoDelSueldoBase(nuevoSueldo, sueldoBase) {
    if (nuevoSueldo < sueldoBase)
      throw "El sueldo esta por debajo del sueldo base del empleado"
  }
  
  function elSueldoActualEsIgualAlAumento(nuevoSueldo, sueldoActual) {
    if (nuevoSueldo === sueldoActual)
      throw "No se aplico el evento. El suedo nuevo es igual que el sueldo actual"
  }

  function crearHistorialDeEventos(evento) {
    return {
      fechaDeRegistroDeEvento: new Date(),
      evento: evento
    }
  }