const mongoose = require("mongoose")
const Schema = mongoose.Schema
const uniqueValidator = require("mongoose-unique-validator")
const httpContext = require("express-http-context")
const jwt = require("jsonwebtoken")
const SEED = require("../../../config/config").SEED

/**
 *
 * Esta es una descripcion del puesto. Ver PEOp 2002 para su estructura
 *
 * "Procedimiento general de recursos humanos" Apendice 11.4
 */

const PuestoSchema = new Schema(
  {
    motivoDeCambio: [
      {
        motivo: {
          type: String,
          require: ["true", "Debes especificar el motivo del cambio"],
          default: "Primer cambio"
        },
        usuario: { type: Schema.Types.ObjectId, ref: "Usuario" },
        fecha: { type: Date, default: Date.now }
      }
    ],
    fechaDeCreacionDePuesto: { type: Date, default: Date.now },
    vigenciaEnAnios: { type: Number, default: 2 },
    // historial: [require("./historialDePuesto.model")],

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
        ref: "Empleado"
        // require: [true, "Es necesario definir quien desarrollo"]
      },
      reviso: {
        type: Schema.Types.ObjectId,
        ref: "Empleado"
        // require: [true, "Es necesario definir quien reviso"]
      },
      aprobo: {
        type: Schema.Types.ObjectId,
        ref: "Empleado"
        // require: [true, "Es necesario definir quien aprobo"]
      }
    },

    sueldoBase: Number,
    sueldoMaximo: Number,
    numeroDeExtencion: Number
  },
  { collection: "puestos" }
)
PuestoSchema.plugin(uniqueValidator, { message: "'{PATH}' debe ser único." })
function obtenerUsuario(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, SEED, (err, decode) => {
      if (err) return reject(new Error(err))
      // cualquier petición. Lo extraemos del decode.
      return resolve(decode.usuario)
    })
  })
}

async function puestoDeEmpleadosRelacionadosANull(next) {
  //Buscamos todos los empledos que tengan como puesto
  // actual este y ponemos el puestoActual en null.
  const Empleado = mongoose.model("Empleado")
  const usuario = await ObtenerYDecodificarUsuario()
  return Empleado.find({ puestoActual: this._id })
    .exec()
    .then(empleados => {
      if (empleados.length === 0) return

      const promesas = []

      empleados.forEach(empleado => {
        empleado.puestoActual = null
        agregarMotivoDeCambio(
          this,
          `Se removio el puesto "${this.puesto}" de el campo "Puesto actual" por que se elimino de la base de datos`,
          usuario
        )
        promesas.push(empleado.save())
      })

      return Promise.all(promesas)
    })
    .then(() => next())
    .catch(err => {
      next(err)
    })
}

async function ObtenerYDecodificarUsuario() {
  return await obtenerUsuario(httpContext.get("token"))
}

async function puestoReportaAANull(next) {
  //Obtenemos el usuario logueado
  const usuario = await ObtenerYDecodificarUsuario()

  const Puesto = mongoose.model("Puesto")
  await Puesto.find({ reportaA: this._id })
    .exec()
    .then(puestos => {
      if (puestos.length === 0) return null
      const promesas = []

      puestos.forEach(puesto => {
        puesto.reportaA = null
        agregarMotivoDeCambio(
          puesto,
          `Se removio el puesto "${this.puesto}" del campo "Reporta A" por que se elimino de la base de datos`,
          usuario
        )
        promesas.push(puesto.save())
      })

      return Promise.all(promesas)
    })
    .then(() => next())
    .catch(err => next(err))
}

function agregarMotivoDeCambio(puesto, msj, usuario) {
  puesto.motivoDeCambio.unshift({
    motivo: `SISTEMA : ${msj} `,
    usuario: usuario
  })
}

function limpiarArray(array) {
  while (array.length) {
    array.pop()
  }
}

async function puestoPersonalAcargoEliminarDeArreglo(next) {
  //Buscamos todos los puestos que tengan a cargo
  // este puesto y los quitamos del arreglo.
  //Obtenemos el usuario logueado
  const usuario = await ObtenerYDecodificarUsuario()
  const Puesto = mongoose.model("Puesto")

  await Puesto.find({ personalACargo: this._id })
    .exec()
    .then(puestos => {
      if (puestos.length === 0) return null
      const promesas = []
      puestos.forEach(puesto => {
        limpiarArray(puesto.personalACargo)
        puesto.personalACargo.concat(
          puesto.personalACargo.filter(x => x != this._id)
        )
        agregarMotivoDeCambio(
          puesto,
          `Se removio el puesto "${this.puesto}" del campo "Personal a cargo" por que se elimino de la base de datos`,
          usuario
        )
        promesas.push(puesto.save())
      })
      return Promise.all(promesas)
    })
    .then(() => next())
    .catch(err => next(err))
}

async function puestoElPuestoPuedeDesarrollarseEnLasSiguientesAreasEliminarDeArreglo(
  next
) {
  //Obtenemos el usuario logueado
  const usuario = await ObtenerYDecodificarUsuario()

  const Puesto = mongoose.model("Puesto")
  await Puesto.find({
    elPuestoPuedeDesarrollarseEnLasSiguientesAreas: this._id
  })
    .exec()
    .then(puestos => {
      const promesas = []

      puestos.forEach(puesto => {
        limpiarArray(puesto.elPuestoPuedeDesarrollarseEnLasSiguientesAreas)
        puesto.elPuestoPuedeDesarrollarseEnLasSiguientesAreas.concat(
          puesto.elPuestoPuedeDesarrollarseEnLasSiguientesAreas.filter(
            x => x != this._id
          )
        )
        agregarMotivoDeCambio(
          puesto,
          `Se removio el puesto "${this.puesto}" del campo "El puesto puede desarrollarse en las siguientes areas" por que se elimino de la base de datos`,
          usuario
        )

        promesas.push(puesto.save())
      })

      return Promise.all(promesas)
    })
    .then(() => next())
    .catch(err => next(err))
}

function autoPopulate(next) {
  this.populate("cursosRequeridos", " -asistencias")
  this.populate("departamento")
  this.populate("relacionClienteProveedor.internos.departamento")

  const lessFieldsEmpleado = "-asistencia -eventos -puestoActual"
  this.populate("quien.desarrollo", lessFieldsEmpleado)
  this.populate("quien.reviso", lessFieldsEmpleado)
  this.populate("quien.aprobo", lessFieldsEmpleado)
  this.populate("motivoDeCambio.usuario", "-password")

  return next()
}

PuestoSchema
  // .pre("save", guardarHistorial)
  .pre("find", autoPopulate)
  .pre("findById", autoPopulate)
  .pre("findOne", autoPopulate)

  .pre("remove", puestoDeEmpleadosRelacionadosANull)
  .pre("remove", puestoReportaAANull)
  .pre("remove", puestoPersonalAcargoEliminarDeArreglo)
  .pre(
    "remove",
    puestoElPuestoPuedeDesarrollarseEnLasSiguientesAreasEliminarDeArreglo
  )

module.exports = mongoose.model("Puesto", PuestoSchema)
