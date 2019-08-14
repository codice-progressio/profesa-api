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

    metodosDePagoAceptados: [{ type: String }],
    condicionesDePago: [{ type: String }],
    formasDePago: [{ type: String }],

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

module.exports = mongoose.model("Proveedor", ProveedorSchema)
