const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")

module.exports.nuevoPermiso = function(datos) {
  return Empleado.findById(datos._id)
    .exec()
    .then(empleado => primerasComprobaciones(empleado, datos))
  //No se pueden agregar eventos si hay pendientes.
  //Se debe dejar en espera hasta que rh confirme que
  //se dio el permiso.
}

function primerasComprobaciones(empleado, datos) {
  if (!empleado) throw "El empleado no existe"

  const objDoc = empleado.toObject()
  //No debe haber eventos pendientes de definir.
  const histEventoPendiente = objDoc.eventos.find(historialDeEvento => {
    //El evento sin el historial por que aqui esta la estructura
    // historialDeEventos.evento (notese el plural)
    const ev = historialDeEvento.evento
    //Es un evento marcado como pendiente de definir y
    // que pertenece a los permisos.
    return ev.hasOwnProperty("permiso") && ev.eventoPendienteDeDefinir
  })

  //Si hay un evento marcado con la bandera de pendiente entonces
  // solo debe recibir autorizacion.
  if (histEventoPendiente) {
    throw "Este empleado tiene un permiso pendiente por autorizar. Para poder agregar un nuevo permiso es necesario autorizar o cancelar el permiso pendiente por parte de recursos humanos."
  } else {
    //Es un evento nuevo y si no trae autorizaciones
    // completas se debe poner como pendiente para la siguiente
    // ves que se compruebe
    const quedaComoPendiente = !(
      datos.autorizacionRH && datos.autorizacionSupervisor
    )

    const evento = {}
    evento["eventoPendienteDeDefinir"] = quedaComoPendiente
    evento["permiso"] = datos
    empleado.eventos.unshift(crearHistorialDeEventos(evento))
    return empleado.save()
  }
}

function crearHistorialDeEventos(evento) {
  return {
    fechaDeRegistroDeEvento: new Date(),
    evento: evento
  }
}

module.exports.autorizar = function(datos) {
  return Empleado.findById(datos._id)
    .exec()
    .then(emp => {
      if (!emp) throw "No existe el empleado"

      const evHist = emp.eventos.id(datos.idHisto)
      if (!evHist) throw "No existe el evento"

      if (evHist.eventoPendienteDeDefinir)
        throw "Este evento ya esta autorizado"

      evHist.evento.permiso.autorizacionRH = true
      evHist.evento.eventoPendienteDeDefinir = false
      return emp.save()
    })
}

module.exports.rechazar = function(datos){ 
  return Empleado.findById(datos._id)
  .exec()
  .then(emp => {
    if (!emp) throw "No existe el empleado"

    const evHist = emp.eventos.id(datos.idHisto)
    if (!evHist) throw "No existe el evento"

    if (evHist.eventoPendienteDeDefinir)
      throw "Este evento ya esta definido"

    evHist.evento.permiso.autorizacionRH = false
    evHist.evento.permiso.rechazado = true
    evHist.evento.permiso.motivoRechazo = datos.motivoRechazado
    evHist.evento.permiso.fechaRechazo = new Date()
    evHist.evento.eventoPendienteDeDefinir = false
    return emp.save()
  })
}
