var mongoose = require("mongoose")

var Schema = mongoose.Schema
var RelacionArticuloSchema = require("./relacionArticulo.model")
var DomicilioSchema = require("./domicilio.model")
let uniqueValidator = require("mongoose-unique-validator")

var ProveedorSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es un valor obligatorio"]
    },
    razonSocial: { type: String },

    domicilios: [DomicilioSchema],

    contactos: [
      {
        nombre: { type: String },
        telefono: { type: String },
        correo: { type: String },
        puesto: { type: String }
      }
    ],
    tiempoDeEntregaEstimadoEnDias: { type: Number },

    relacionArticulos: [RelacionArticuloSchema],

    rfc: { type: String, unique: true },

    metodosDePagoAceptados: [ String ],
    condicionesDePago: [ String ],
    formasDePago: [ String ],

    cuentas: [
      {
        clabe: Number,
        banco: String
      }
    ]

    // Esto de aqui es para que mongose no escriba hospitals en vez de hospitales
  },
  { collection: "proveedores" }
)
ProveedorSchema.plugin(uniqueValidator, { message: "'{PATH}' debe ser único." })

function autoPopulate(next) {
  this.populate("relacionArticulos.item")
  this.populate("relacionArticulos.divisa")
  next()
}


ProveedorSchema.pre("find", autoPopulate).pre("findOne", autoPopulate)

module.exports = mongoose.model("Proveedor", ProveedorSchema)
