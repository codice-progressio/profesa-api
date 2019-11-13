const mongoose = require("mongoose")
const Schema = mongoose.Schema
const uniqueValidator = require("mongoose-unique-validator")
const httpContext = require("express-http-context")
const jwt = require("jsonwebtoken")
const SEED = require("../../../config/config").SEED
const DepartamentoSchema = require("../../departamento")
const EmpleadoSchema = require("../empleados/empleado.model")
const CursoSchema = require("../cursos/curso.model")

/**
 *
 * Esta es una descripcion del puesto. Ver PEOp 2002 para su estructura
 *
 * "Procedimiento general de recursos humanos" Apendice 11.4
 */

const PuestoSchema = new Schema(
  {
    motivoDeCambio: {
      type: String,
      require: ["true", "Debes especificar el motivo del cambio"],
      default: "Primer cambio"
    },
    fechaDeCreacionDePuesto: { type: Date, default: Date.now },
    vigenciaEnAnios: { type: Number, default: 2 },
    historial: [require("./historialDePuesto.model")],

    cursosRequeridos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Curso"
      }
    ],

    puesto: String,
    departamento: {
      type: Schema.Types.ObjectId,
      ref: "Departamento"
    },
    reportaA: {
      type: Schema.Types.ObjectId,
      ref: "Puesto"
    },
    //Se genera desde la GUI.
    organigrama: String,
    misionDelPuesto: String,
    personalACargo: [
      {
        type: Schema.Types.ObjectId,
        ref: "Puesto"
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
        ref: "Puesto"
      }
    ],

    quien: {
      desarrollo: {
        type: Schema.Types.ObjectId,
        ref: "Empleado",
        require: [true, "Es necesario definir quien desarrollo"]
      },
      reviso: {
        type: Schema.Types.ObjectId,
        ref: "Empleado",
        require: [true, "Es necesario definir quien reviso"]
      },
      aprobo: {
        type: Schema.Types.ObjectId,
        ref: "Empleado",
        require: [true, "Es necesario definir quien aprobo"]
      }
    },

    sueldoBase: Number,
    sueldoMaximo: Number,
    numeroDeExtencion: Number
  },
  { collection: "puestos" }
)
PuestoSchema.plugin(uniqueValidator, { message: "'{PATH}' debe ser único." })

// TODO: Antes de guardar hay que copiar los datos al historial. (Ver el historial de requisiciones. )

function obtenerUsuario(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, SEED, (err, decode) => {
      if (err) return reject(new Error(err))
      // cualquier petición. Lo extraemos del decode.
      return resolve(decode.usuario)
    })
  })
}

function guardarHistorial(next) {
  // Obtenemos el usuario logueado
  return obtenerUsuario(httpContext.get("token"))
    .then((decodeUser) => {
      //Si no hay historial creamos el arreglo.
      if (!this.historial) {
        this.historial = []
      }

      let historial = sustituirValoresConflictivosYRetornarObjeto(this)
      // Limpiamos el historial para que
      // no se haga exponencial

      //Seteamos la historia.
      this.historial.unshift({
        fechaDeCambio: new Date(),
        usuarioQueModifica: decodeUser,
        cambioAnterior: historial
      })
    })
    .catch((err) => next(err))

  //Copiamos todo al historial
}



/**
 *Convierte todos los valores que habiamos populado de nuevo a su id.
 *
 * @param {*} puesto El objeto antes de ser guardado.
 */
function sustituirValoresConflictivosYRetornarObjeto(puesto) {


  var personalACargo = puesto.personalACargo.map((empleado) =>  {empleado._id})
  var reportaA = puesto.reportaA ? puesto.reportaA._id : null

  var puestoOb = puesto.toObject()
  delete puestoOb.historial

  puestoOb.personalACargo = personalACargo
  puestoOb.reportaA = reportaA

  return puestoOb
}

function autoPopulate(next) {
  let puestoSchema = mongoose.model('Puesto')


  this.populate("departamento")
  this.populate("reportaA")
  this.populate("personalACargo")
  this.populate("cursosRequeridos")
  this.populate("relacionClienteProveedor.internos.departamento")
  this.populate("quien.desarrollo")
  this.populate("quien.reviso")
  this.populate("quien.aprobo")
  this.populate("elPuestoPuedeDesarrollarseEnLasSiguientesAreas")
  this.populate("historial.usuarioQueModifica", "-password -role")
  let his = "historial.cambioAnterior."
  this.populate({ path: his + "departamento", model: DepartamentoSchema })
  this.populate({ path: his + "reportaA", model: puestoSchema })
  this.populate({ path: his + "personalACargo", model: puestoSchema })
  this.populate({ path: his + "cursosRequeridos", model: CursoSchema })
  this.populate({
    path: his + "relacionClienteProveedor.internos.departamento",
    model: DepartamentoSchema
  })
  this.populate({ path: his + "quien.desarrollo", model: EmpleadoSchema })
  this.populate({ path: his + "quien.reviso", model: EmpleadoSchema })
  this.populate({ path: his + "quien.aprobo", model: EmpleadoSchema })
  this.populate({
    path: his + "elPuestoPuedeDesarrollarseEnLasSiguientesAreas",
    model: puestoSchema
  })

  next()
}

PuestoSchema.pre("save", guardarHistorial)
  .pre("findById", autoPopulate)
  .pre("findOne", autoPopulate)
  .pre("find", autoPopulate)


  module.exports = mongoose.model("Puesto", PuestoSchema)