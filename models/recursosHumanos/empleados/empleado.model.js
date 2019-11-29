const mongoose = require("mongoose")
const Schema = mongoose.Schema
const uniqueValidator = require("mongoose-unique-validator")
const Puesto = require("../puestos/puesto.model")

const fs = require("fs")

const EmpleadoSchema = new Schema(
  {
    idChecador: String,
    idNomina: { type: String, unique: true},
    nombres: String,
    apellidos: String,
    fechaDeNacimiento: Date,
    //0 - H, 1 - M
    sexo: Boolean,
    curp: String,
    rfc: String,
    numeroDeCuenta: String,
    numeroDeSeguridadSocial: { type: String },
    fotografia: String,
    sueldoActual: Number,
    puestoActual: {
      type: Schema.Types.ObjectId,
      ref: "Puesto",
      required: [true, "Es necesario definir el puesto para este empleado"]
    },
    //Relacionado a eventosRH. estatusLaboral.
    activo: Boolean,
    //El puesto esta dentro de los eventos.
    eventos: [require("./historialDeEventos.model")],
    documentos: require("./empleadoDocumentos.model"),

    asistencia: {
      // La asistencia del checador debe de llevar
      // esta estructura.
      // 2019: {
      //     12:{
      //         1:[
      //             '12:30',
      //             '12:45',
      //             '15:30',
      //         ]
      //     }
      // }
      checador: {},
      supervisor: [
        {
          dia: Date,
          asistencia: Boolean,
          falta: Boolean,
          retardo: Boolean,
          comentario: String
        }
      ]
    }
  },
  { collection: "empleados" }
)
EmpleadoSchema.plugin(uniqueValidator, { message: "'{PATH}' debe ser único." })

function crearEventoAltaDeNuevoEmpleado(next) {
  // Antes de guardar un nuevo empleado creamos el evento
  // de alta
  if (this.isNew) {
    Puesto.findById(this.puestoActual._id)
      .then(puesto => {
        if (!puesto) throw "El puesto no existe"
        if (!this.eventos) this.eventos = []
        this.eventos.unshift({
          fechaDeRegistroDeEvento: new Date(),
          evento: {
            estatusLaboral: {
              alta: true
            }
          }
        })

        //Tiene que estar activo
        this.activo = true
        this.eventos.unshift({
          fechaDeRegistroDeEvento: new Date(),
          evento: {
            puesto: {
              anterior: null,
              nuevo: puesto
            }
          }
        })

        this.sueldoActual = puesto.sueldoBase
        next()
      })
      .catch(err => next(err))
  } else {
    next()
  }
}

function autoPopulate(next) {
  this.populate("puestoActual")
  next()
}

function eliminarAsistenciasDeCurso(next) {
  //Buscamos todos los cursos que contengan a este
  // empleado en la asistencia y los eliminamos.
  const Curso = mongoose.model("Curso")

  Curso.find({ asistencias: { empleado: this._id } })
    .exec()
    .then(cursos => {
      if (cursos.length === 0) return
      const promesas = []

      cursos.asistencias = cursos.asistencias.filter(
        x => x.empleado != this._id
      )

      cursos.asistencias.forEach(curso => {
        this.promesas.push(curso.save())
      })

      return Promise.all(promesas)
    })
    .then(() => next())
    .catch(err => next(err))
}

function eliminarFoto(next) {
  const path = `./uploads/empleados/${this.fotografia}`
  if (fs.existsSync(path)) {
    fs.unlinkSync(path)
  }
  next()
}

EmpleadoSchema.pre("save", crearEventoAltaDeNuevoEmpleado)
  .pre("find", autoPopulate)
  .pre("findOne", autoPopulate)
  .pre("findById", autoPopulate)
  .pre("remove", eliminarAsistenciasDeCurso)
  .pre("remove", eliminarFoto)
module.exports = mongoose.model("Empleado", EmpleadoSchema)
