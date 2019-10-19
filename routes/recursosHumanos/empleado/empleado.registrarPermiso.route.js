const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")

module.exports = function(datos) {
  return Empleado.findById(datos._id)
    .exec()
    .then((empleado) => primerasComprobaciones(empleado, datos))
  //No se pueden agregar eventos si hay pendientes.
  //Se debe dejar en espera hasta que rh confirme que
  //se dio el permiso.
}

function primerasComprobaciones(empleado, datos) {
  if (!empleado) throw "El empleado no existe"
  //No debe de haber eventos pendientes por definir
  return revisarEventos(
    empleado,
    datos,
    comprobarSiHayEventosPorDefinir(empleado)
  )
}

function comprobarSiHayEventosPorDefinir(empleado) {
  var evento = empleado.eventos.find((evento) => {
    if (evento.evento) {
      return evento.evento.eventoPendienteDeDefinir
    }
  })
  return !!evento
}

function revisarEventos(empleado, datos, hayEventosPorDefinir) {
  if (hayEventosPorDefinir) {
    return comprobarSiEsTerminacionDelEvento(empleado, datos)
  } else {
    return crearNuevoEventoConDefinicionPendiente(empleado, datos)
  }
}

function comprobarSiEsTerminacionDelEvento(empleado, datos) {
  // Para que se pueda terminar el evento se debe recivir
  // la autorizacion de rh. Para esto hay que comprobar
  //    que los datos traingan el la autorizacion.

  if (datos.autorizacionRH) {
    return autorizarPermiso(empleado)
  } else {
    throw "RH debe autorizar este permiso para que se pueda agregar otro."
  }
}

function autorizarPermiso(empleado) {
  const epd = empleado.eventos.find((e) => {
    return e.evento.eventoPendienteDeDefinir
  })

  epd.evento.eventoPendienteDeDefinir = false
  epd.evento.permiso.autorizacionRH = true
  return empleado.save()
}

function crearNuevoEventoConDefinicionPendiente(empleado, datos) {
  const evento = {}
  evento["eventoPendienteDeDefinir"] = true

  delete datos.eventoPendienteDeDefinir
  delete datos._id

  Object.keys(datos.motivo).forEach((k) => {
    if (!datos.motivo[k]) delete datos.motivo[k]
  })

  Object.keys(datos).forEach((k) => {
    if (!datos[k]) delete datos[k]
  })

  evento["permiso"] = datos

  empleado.eventos.unshift(crearHistorialDeEventos(evento))

  return empleado.save()
}

function crearHistorialDeEventos(evento) {
  return {
    fechaDeRegistroDeEvento: new Date(),
    evento: evento
  }
}
