const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")

module.exports = function(datos) {
  return Empleado.findById(datos._id)
    .exec()
    .then((empleado) => {
      if (!empleado) throw "No existe el empleado"

      empleado.eventos.unshift(crearEvento(datos))

      return empleado.save()
    })
}

function crearEvento(datos) {
  hastaDebeSerMayorQueDesde(datos.desde, datos.hasta)
  const evento = {
    vacaciones: {
      desde: datos.desde,
      hasta: datos.hasta
    }
  }
  return crearHistorialDeEventos(evento)
}

function hastaDebeSerMayorQueDesde(desde, hasta) {
  var desdeD = new Date(desde)
  var hastaD = new Date(hasta)
  if (hastaD < desdeD)
    throw "La fecha de finalizacion es anterior a la de inicio."
}

function crearHistorialDeEventos(evento) {
  return {
    fechaDeRegistroDeEvento: new Date(),
    evento: evento
  }
}
