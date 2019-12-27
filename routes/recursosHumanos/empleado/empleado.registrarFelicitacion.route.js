const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")

module.exports = function(datos) {
  return Empleado.findById(datos._id)
    .exec()
    .then((empleado) => {
      if (!empleado) throw "El empleado no existe"

      empleado.eventos.unshift(crearEvento(datos))
      return empleado.save()
    })
}

function crearEvento(datos) {
  const evento = {
    felicitacionPorEscrito: {
      fecha: datos.fecha,
      documento: datos.documento
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
