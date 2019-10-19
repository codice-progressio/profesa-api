const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")

module.exports.modificarEstatusLaboral = function(datos) {
  console.log(datos)
  return Empleado.findById(datos._id)
    .exec()
    .then((empleado) => {
      if (!empleado) throw "El empleado no existe"
      return crearEventos(datos, empleado)
    })
}

function crearEventos(datos, empleado) {
  if (datos.baja) return crearEventoDeBaja(empleado, datos.observaciones)
  if (datos.reingreso)
    return crearEventoDeReingreso(empleado, datos.observaciones)
}

function crearEventoDeBaja(empleado, observaciones) {
  const evento = {
    estatusLaboral: {
      //Relacionado con activo del empleado
      baja: true,
      observaciones: observaciones
    }
  }
  empleado.activo = false
  empleado.eventos.unshift( crearHistorialDeEventos(evento))
  return empleado.save()
}
function crearEventoDeReingreso(empleado, observaciones) {
  const evento = {
    estatusLaboral: {
      //Relacionado con activo del empleado
      reingreso: true,
      observaciones: observaciones
    }
  }
  empleado.activo = true
  empleado.eventos.unshift( crearHistorialDeEventos(evento))
  return empleado.save()
}

function crearHistorialDeEventos(evento) {
  return {
    fechaDeRegistroDeEvento: new Date(),
    evento: evento
  }
}
