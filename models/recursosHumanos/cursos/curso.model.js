const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Puesto = require("../puestos/puesto.model")

const CursoModelSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "Debes definir un nombre para el curso"]
    },
    // fechaDeCurso: Date,
    duracion: {
      type: Number,
      required: [true, "Es necesario definir la duracion"]
    },
    instructor: {
      type: String,
      required: [true, "El instructor es necesario"]
    },
    descripcionDeCurso: {
      type: String,
      required: [true, "Debes describir el curso"]
    },
    //Es obligatorio
    esCursoDeTroncoComun: { type: Boolean, default: true },
    esCursoDeEspecializacion: Boolean,
    asistencias: [
      {
        empleado: {
          type: Schema.Types.ObjectId,
          ref: "Empleado"
        },
        fecha: Date
      }
    ]
  },
  { collection: "cursos" }
)

/**
 * Primero buscamos el curso y luego encadenamos con este
 * valor.
 *
 */
CursoModelSchema.methods.agregarAsistenciaATodos = function(
  arregloDeIdDeEmpleados
) {
  for (let i = 0; i < arregloDeIdDeEmpleados.length; i++) {
    const idEmpleado = arregloDeIdDeEmpleados[i]
    this.asistencias.push({
      empleado: Schema.ObjectId(idEmpleado),
      date: new Date()
    })

    return this.save()
  }
}

function eliminarCursoDePuestos(next) {
  //Buscamos todos los puestos que tengar
  // el curso que se va a eliminar.
  Puesto.find({ cursosRequeridos: this._id })
    .exec()
    .then((puestos) => {
      if (puestos.length === 0) return

      const promesas = []
      puestos.forEach((puesto) => {
        puesto.cursosRequeridos = puesto.cursosRequeridos.filter(
          (x) => x != this._id
        )

        promesas.push(puesto.save())
      })
      return Promise.all(promesas)
    })
    .then(() => next())
    .catch((err) => next(err))
}

CursoModelSchema.pre("remove", eliminarCursoDePuestos)

module.exports = mongoose.model("Curso", CursoModelSchema)
