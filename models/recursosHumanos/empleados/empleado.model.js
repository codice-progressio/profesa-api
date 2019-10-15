const mongoose = require("mongoose")
const Schema = mongoose.Schema
const uniqueValidator = require("mongoose-unique-validator")

const EmpleadoSchema = new Schema(
  {
    idChecador: { type: Number },
    idNomina: { type: Number, unique: true },
    nombres: String,
    apellidos: String,
    fechaDeNacimento: Date,
    sexo: String,
    curp: String,
    rfc: String,
    numeroDeCuenta: String,
    númeroDeSeguridadSocial: String,
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

module.exports = mongoose.model("Empleado", EmpleadoSchema)

// TODO: Actualizar automaticamente el sueldo al cambiar de puesto
// TODO: Actualizar sueldo al aumentar/
// TODO: Actualizar el puesto actual al crear un nuevo evento.
// TODO: Actualizar el estatus cuando se desencadene un estatusLaboral.
