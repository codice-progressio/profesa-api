const mongoose = require("mongoose")
const Schema = mongoose.Schema
const uniqueValidator = require("mongoose-unique-validator")
const Puesto = require("../puestos/puesto.model")

const EmpleadoSchema = new Schema(
  {
    idChecador: { type: String, unique: true },
    idNomina: { type: String, unique: true },
    nombres: String,
    apellidos: String,
    fechaDeNacimiento: Date,
    //0 - H, 1 - M
    sexo: Boolean,
    curp: { type: String, unique: true },
    rfc: { type: String, unique: true },
    numeroDeCuenta: { type: String, unique: true },
    numeroDeSeguridadSocial: { type: String, unique: true },
    fotografia: String,
    sueldoActual: Number,
    puestoActual: {
      type: Schema.Types.ObjectId,
      ref: "Puesto"
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
      .then((puesto) => {
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
      .catch((err) => next(err))
  } else {
    next()
  }
}



function autoPopulate( next ){

  this.populate('puestoActual')
  next()

}

EmpleadoSchema
  .pre("save", crearEventoAltaDeNuevoEmpleado)
  .pre("find", autoPopulate)
  .pre("findOne", autoPopulate)
  .pre("findById", autoPopulate)
module.exports = mongoose.model("Empleado", EmpleadoSchema)
