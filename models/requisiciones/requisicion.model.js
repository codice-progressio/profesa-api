var mongoose = require("mongoose")
var Schema = mongoose.Schema
var uniqueValidator = require("mongoose-unique-validator")
var AutoIncrement = require("mongoose-sequence")(mongoose)
var EstatusRequisicionsSchema = require("./estatusRequisicion.model")
var HistorialDeEstatusSchema = require("./historialDeEstatusRequisicion.model")
var httpContext = require("express-http-context")

var ArticuloSchema = require("../almacenRefaccionesYMateriaPrima/articulo.model")

var SEED = require("../../config/config").SEED

var jwt = require("jsonwebtoken")
var RequisicionSchema = new Schema(
  {
    folio: Number,
    usuario: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: [true, "El usuario es necesario"]
    },

    materiaPrima: Boolean,
    consumibles: Boolean,
    gastosYServicios: Boolean,

    cantidad: {
      type: Number,
      require: [true, "La cantidad es necesaria"],
      min: 0.001
    },
    articulo: {
      type: Schema.Types.ObjectId,
      ref: "Articulo",
      required: [true, "El articulo es obligatorio"]
    },
    estatus: EstatusRequisicionsSchema,
    //Una copia del status con fecha.
    historialDeEstatus: [HistorialDeEstatusSchema],
    razonDeCambioTemp: String,
    observaciones: String
  },
  { collection: "requisiciones", timestamps: true }
)

RequisicionSchema.plugin(AutoIncrement, {
  id: "numeroDeRequisicion_seq",
  inc_field: "folio"
})

RequisicionSchema.plugin(uniqueValidator, {
  message: "El campo '{PATH}' debe ser único."
})

function obtenerUsuario(token, self, next, cb) {
  jwt.verify(token, SEED, (err, decode) => {
    if (err) {
      next(new Error(err))
      return
    }

    // Colocar la información del usuario en
    // cualquier petición. Lo extraemos del decode.

    cb(self, decode.usuario, next)
  })
}

// <!--
// =====================================
//  Cargas necesarias - Usuario, historial, etc
// =====================================
// -->

var cargarUsuarioActivo = function(next) {
  if (!this.usuario) {
    // Obtenemos el usuario logueado

    var cb = (self, decodeUser, next) => {
      self.usuario = decodeUser
      next()
    }
    obtenerUsuario(httpContext.get("token"), this, next, cb)
  } else {
    next()
  }
}

var copiarDatosAHistorial = function(next) {
  var cb = (self, decodeUser, next) => {
    self.historialDeEstatus.unshift({
      estatus: self.estatus,
      razonDeCambio: self.razonDeCambioTemp
        ? self.razonDeCambioTemp
        : `EL USUARIO '${decodeUser.nombre}' NO DEFINIO LA RAZON `,
      usuarioQueModifica: decodeUser
    })

    next()
  }

  obtenerUsuario(httpContext.get("token"), this, next, cb)
}

// <!--
// =====================================
//  END Cargas necesarias - Usuario, historial, etc
// =====================================
// -->

function autoPopulate(next) {
  this.populate("usuario")
  this.populate("articulo")
  this.populate("historialDeEstatus.usuarioQueModifica")

  next()
}

function hidePass(requisicion) {
  requisicion.usuario.role = []
  requisicion.usuario.password = ":D"
  if (requisicion.historialDeEstatus) {
    requisicion.historialDeEstatus.forEach(y => {
      y.usuarioQueModifica.password = ":D"
      y.usuarioQueModifica.role = []
    })
  }
}

function abonarAlArticulo(next) {
  var a = this.isModified("estatus.cantidadEntregadaALaFecha")
  var b = obtenerDiferenciaEntreEstatus(this) > 0

  if (a && b) {
    guardarArticulo(next, this)
    return
  } else {
    next()
  }
}

function guardarArticulo(next, self) {
  // Buscamos el articulo

  ArticuloSchema.findById(self.articulo._id)
    .exec()
    .then(articulo => guardarArticulo_guardar(articulo, self))
    .then(() => next())
    .catch(err => next(err))
}

function guardarArticulo_guardar(articulo, self) {
  //Mensaje por defeco cuando se agrega requisicion.
  let observacion = `Entrada por requisicion. FOL ${self.folio}.`

  if (!articulo)
    throw "No existe el articulo para agregar la entrada de la requisicion."

  if (!articulo.entradas) articulo.entradas = []

  var cantidadARegistrar = obtenerDiferenciaEntreEstatus(self)
  // Si existe el articulo solo modificamos
  articulo.entradas.push({
    cantidad: cantidadARegistrar,
    observaciones: observacion,
    requisicion: self
  })

  articulo.existencia = (
    articulo.existencia * 1 +
    cantidadARegistrar * 1
  ).toPrecision(3)

  return articulo.save()
}

function obtenerDiferenciaEntreEstatus(requisicion) {
  var diferencia = 0
  var arrayHistorialDeEstatus = requisicion.historialDeEstatus
  // La diferencia se debe de obtener de:
  // los dos ultimos estatus
  if (requisicion.historialDeEstatus.length > 1) {
    // Tomamos el segundo valor
    var anterior = arrayHistorialDeEstatus[1].estatus.cantidadEntregadaALaFecha
    var nueva = requisicion.estatus.cantidadEntregadaALaFecha

    diferencia = (nueva - anterior).toPrecision(3)
  }
  // Si solo hay uno entoces la diferencia es igual al primer estatus.
  if (arrayHistorialDeEstatus.length < 2) {
    diferencia = requisicion.estatus.cantidadEntregadaALaFecha
  }
  return diferencia
}

RequisicionSchema.pre("validate", cargarUsuarioActivo)
  .pre("validate", copiarDatosAHistorial)
  .pre("find", autoPopulate)
  .pre("findOne", autoPopulate)
  .pre("findById", autoPopulate)
  .pre("save", abonarAlArticulo)
  .post("find", function(requisicion) {
    requisicion.forEach(x => hidePass(x))
  })
  .post("findOne", hidePass)
  .post("findById", hidePass)

module.exports = mongoose.model("Requisicion", RequisicionSchema)
