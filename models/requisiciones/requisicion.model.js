var mongoose = require("mongoose")
var Schema = mongoose.Schema
var uniqueValidator = require("mongoose-unique-validator")
var AutoIncrement = require("mongoose-sequence")(mongoose)
var EstatusRequisicionsSchema = require("./estatusRequisicion.model")
var HistorialDeEstatusSchema = require("./historialDeEstatusRequisicion.model")
var httpContext = require("express-http-context")

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

    cantidad: { type: Number, require: [true, "La cantidad es necesaria"] },
    articulo: {
      type: Schema.Types.ObjectId,
      ref: "Articulo",
      required: [true, "El articulo es obligatorio"]
    },
    estatus: EstatusRequisicionsSchema,
    //Una copia del status con fecha.
    historialDeEstatus: [HistorialDeEstatusSchema],
    razonDeCambioTemp: String
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

// <!--
// =====================================
//  Cargas necesarias - Usuario, historial, etc
// =====================================
// -->

var cargarUsuarioActivo = function(next) {
  if (!this.usuario) {
    // Obtenemos el usuario logueado
    var user = httpContext.get("usuario")
    this.usuario = user
  }
  next()
}


var copiarDatosAHistorial = function (next)
{
  var user = httpContext.get("usuario")
  this.historialDeEstatus.push({
    status: this.estatus,
    razonDeCambio: this.razonDeCambioTemp
      ? this.razonDeCambioTemp
      : `EL USUARIO '${ user.nombre }' NO DEFINIO LA RAZON `,
    usuarioQueModifica: user
  })

  next()
}

// <!--
// =====================================
//  END Cargas necesarias - Usuario, historial, etc
// =====================================
// -->

RequisicionSchema.pre("validate", cargarUsuarioActivo)
  .pre("validate", copiarDatosAHistorial)
 

module.exports = mongoose.model("requisiciones", RequisicionSchema)
