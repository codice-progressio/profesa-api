const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")

module.exports = function(datos) {
  return Empleado.findById(datos._id)
    .exec()
    .then((empleado) => {
      if (!empleado) throw "No existe el empleado."
      empleado.eventos.unshift(crearEvento(datos))
      return empleado.save()
    })
}

function crearEvento(datos) {
  let evento = {
    castigo: {
      fecha: datos.fecha,
      acta: datos.acta
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
