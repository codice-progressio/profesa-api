const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")

module.exports = function(datos) {
  return Empleado.findById(datos._id)
    .exec()
    .then((empleado) => {
      if (!empleado) throw "El empleado no existe"
      empleado.eventos.id(datos._idEvento).remove()
      return empleado.save()
    })
}
