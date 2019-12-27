const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")

module.exports.baja = function(datos) {
  console.log(datos)
  return Empleado.findById(datos._id)
    .exec()
    .then(empleado => {
      if (!empleado) throw "El empleado no existe"

      if (!empleado.activo) throw "El usuario ya esta inactivo"

      const evento = {
        estatusLaboral: {
          //Relacionado con activo del empleado
          baja: true,
          observaciones: datos.observaciones
        }
      }
      empleado.activo = false
      empleado.eventos.unshift(crearHistorialDeEventos(evento))
      return empleado.save()
    })
}
module.exports.reingreso = function(datos) {
  console.log(datos)
  return Empleado.findById(datos._id)
    .exec()
    .then(empleado => {
      if (!empleado) throw "El empleado no existe"

      if (empleado.activo) throw "El usuario ya esta activo"

      const evento = {
        estatusLaboral: {
          //Relacionado con activo del empleado
          reingreso: true,
          observaciones: datos.observaciones
        }
      }
      empleado.activo = true
      empleado.eventos.unshift(crearHistorialDeEventos(evento))
      return empleado.save()
    
    })
}
module.exports.enfermedadGeneral = function(datos) {
  console.log(datos)
  return Empleado.findById(datos._id)
    .exec()
    .then(empleado => {
      if (!empleado) throw "El empleado no existe"

      if (!empleado.activo)
        throw "El usuario esta inactivo. No puedes asignar incapacidades."

      const evento = {
        estatusLaboral: {
          //Relacionado con activo del empleado
          incapacidadEnfermedadGeneral: true,
          observaciones: datos.observaciones
        }
      }
      empleado.eventos.unshift(crearHistorialDeEventos(evento))
      return empleado.save()
    })
}
module.exports.riesgoDeTrabajo = function(datos) {
  console.log(datos)
  return Empleado.findById(datos._id)
    .exec()
    .then(empleado => {
      if (!empleado) throw "El empleado no existe"

      if (!empleado.activo)
        throw "El usuario esta inactivo. No puedes asignar incapacidades."

      const evento = {
        estatusLaboral: {
          //Relacionado con activo del empleado
          incapacidadRiesgoDeTrabajo: true,
          observaciones: datos.observaciones
        }
      }
      empleado.eventos.unshift(crearHistorialDeEventos(evento))
      return empleado.save()
    })
}
module.exports.maternidad = function(datos) {
  console.log(datos)
  return Empleado.findById(datos._id)
    .exec()
    .then(empleado => {
      if (!empleado) throw "El empleado no existe"

      if (!empleado.activo)
        throw "El usuario esta inactivo. No puedes asignar incapacidades."

      const evento = {
        estatusLaboral: {
          //Relacionado con activo del empleado
          incapacidadMaternidad: true,
          observaciones: datos.observaciones
        }
      }
      empleado.eventos.unshift(crearHistorialDeEventos(evento))
      return empleado.save()
    })
}

function crearHistorialDeEventos(evento) {
  return {
    fechaDeRegistroDeEvento: new Date(),
    evento: evento
  }
}
