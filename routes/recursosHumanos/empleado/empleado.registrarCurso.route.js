const Empleado = require("../../../models/recursosHumanos/empleados/empleado.model")
const Curso = require("../../../models/recursosHumanos/cursos/curso.model")

module.exports = function(datos) {
  return Promise.all([
    Empleado.findById(datos._id).exec(),
    Curso.findById(datos.idCurso).exec()
  ]).then((resp) => agregarCurso(resp[0], resp[1], datos))
}

function agregarCurso(empleado, curso, datos) {
  existen(empleado, curso)

  empleado.eventos.unshift(crearEvento(curso, datos.fecha))
  if (!curso.asistencias) curso.asistencias = []
  curso.asistencias.unshift({
    empleado: empleado._id,
    fecha: datos.fecha
  })
  //Solo queremos retornar el empleado
  return guardarCambios(empleado, curso)
}

function guardarCambios(empleado, curso) {
  return new Promise((resolve, reject) => {
    Promise.all([empleado.save(), curso.save()])
      .then((resp) => {
        resolve(resp[0])
      })
      .catch((err) => reject(err))
  })
}

function crearEvento(curso, fecha) {
  const evento = { curso: curso }
  return crearHistorialDeEventos(evento, fecha)
}
function existen(empleado, curso) {
  if (!empleado) throw "No existe el empleado"
  if (!curso) throw "No existe el curso"
}

function crearHistorialDeEventos(evento, fecha) {
  return {
    fechaDeRegistroDeEvento: fecha,
    evento: evento
  }
}
