const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")
const Puesto = require("../../../models/recursosHumanos/puestos/puesto.model")

module.exports = function(datos) {
  return Promise.all([
    Empleado.findById(datos._id).exec(),
    Puesto.findById(datos._idPuestoNuevo).exec()
  ])
    .then(datos => obtenerPuestoActual(datos))
    .then(datos => crearEventos(datos))
}

function obtenerPuestoActual(datos) {
  var empleado = datos[0]
  var puestoNuevo = datos[1]
  noExisteAlguno(empleado, puestoNuevo)

  return new Promise((resolve, reject) => {
    Puesto.findById(empleado.puestoActual)
      .exec()
      .then(puesto => {
        resolve([empleado, puesto, puestoNuevo])
      })
      .catch(err => reject(err))
  })
}

function crearEventos(data) {
  var empleado = data[0]
  var puestoAnterior = data[1]
  var puestoNuevo = data[2]
  if (String(puestoAnterior._id) === String(puestoNuevo._id))
    throw "El puesto actual es igual al nuevo puesto"

  //Comprobamos que hay un arreglo en eventos
  if (!empleado.eventos) empleado.eventos = []
  //Crear un evento nuevo de puesto y hacer unshift
  const evNuevoPuesto = crearEventoDePuesto(puestoAnterior, puestoNuevo)
  empleado.eventos.unshift(evNuevoPuesto)

  //Modificar puestoActual
  empleado.puestoActual = puestoNuevo

  // Crear evento de cambioDeSueldo y hacer unshift
  const evNuevoSueldo = crearEventoDeSueldo(
    puestoAnterior.sueldoBase,
    puestoNuevo.sueldoBase
  )
  empleado.eventos.unshift(evNuevoSueldo)

  //Modificar sueldo actual
  empleado.sueldoActual = evNuevoSueldo.evento.cambiosDeSueldo.aumento

  return empleado.save()
}

function crearEventoDeSueldo(anterior, nuevo) {
  var sueldoActual = nuevo
  var observacion =
    "Aumento registrado automaticamente por el sistema al detectar un cambio de puesto."

  //Si el puesto tiene un salario menor
  // al que tiene el empleado no se hace
  //  de manera automatica el bajon.
  if (anterior >= nuevo) {
    sueldoActual = anterior
    observacion =
      "No se aplico automaticamente el aumento. El salario actual es menor o igual que el salario nuevo"
  }

  const evento = {
    cambiosDeSueldo: {
      sueldAnteriorAlCambio: anterior,
      aumento: sueldoActual,
      observacion: observacion
    }
  }

  return crearHistorialDeEventos(evento)
}

function crearEventoDePuesto(anterior, nuevo) {
  const evento = {
    puesto: {
      anterior,
      nuevo
    }
  }

  return crearHistorialDeEventos(evento)
}

function crearHistorialDeEventos(evento) {
  return {
    fechaDeRegistroDeEvento: new Date(),
    evento: evento
  }
}

function noExisteAlguno(emp, puN) {
  //Comprobamos si alguno de estos esta vacio
  // para retornar un throw. Esta comprobacion
  // es para corroborar que los id que nos pasaron
  // son correctos y existe el objeto.
  const a = [
    {
      existe: !puN,
      m: "No existe el puesto nuevo "
    },
    {
      existe: !emp,
      m: "No existe el empleado "
    }
  ]

  a.forEach(d => {
    if (d.existe) throw d.m
  })
}
