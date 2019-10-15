const mongoose = require("mongoose")
const Schema = mongoose.Schema
const uniqueValidator = require("mongoose-unique-validator")
/**
 *
 * Esta es una descripcion del puesto. Ver PEOp 2002 para su estructura
 *
 * "Procedimiento general de recursos humanos" Apendice 11.4
 */

const PuestoSchema = new Schema(
  {
    fechaDeCreacionDePuesto: { type: Date, default: Date.now },
    vigenciaEnAnios: { type: Number, default: 2 },
    historial: [require("./historialDePuesto.model")],

    cursosRequeridos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Cursos"
      }
    ],
    
    puesto: String,
    departamento: {
      type: Schema.Types.ObjectId,
      ref: "Departamento"
    },
    reportaA: {
      type: Schema.Types.ObjectId,
      ref: "Empleado"
    },
    //Se genera desde la GUI.
    organigrama: {},
    misionDelPuesto: String,
    personalACargo: [
      {
        type: Schema.Types.ObjectId,
        ref: "Empleado"
      }
    ],
    perfilDelPuesto: require("./perfilDelPuesto.model"),

    funcionesEspecificasDelPuesto: [
      require("./funcionesEspecificasDelPuesto.model")
    ],

    relacionClienteProveedor: {
      internos: [require("./puesto_relacionClienteProveedorInternos.model")],

      externos: [require("./puesto_relacionClienteProveedorExternos.model")]
    },

    indicesDeEfectividad: [String],

    elPuestoPuedeDesarrollarseEnLasSiguientesAreas: [
      {
        type: Schema.Types.ObjectId,
        ref: "AreasRH"
      }
    ],

    quien: {
      desarrollo: {
        type: Schema.Types.ObjectId,
        ref: "Empleado"
      },
      reviso: {
        type: Schema.Types.ObjectId,
        ref: "Empleado"
      },
      aprobo: {
        type: Schema.Types.ObjectId,
        ref: "Empleado"
      }
    }
  },
  { collection: "puestos" }
)
PuestoSchema.plugin(uniqueValidator, { message: "'{PATH}' debe ser único." })

// TODO: Antes de guardar hay que copiar los datos al historial. (Ver el historial de requisiciones. )

module.exports = mongoose.model("Puesto", PuestoSchema)
