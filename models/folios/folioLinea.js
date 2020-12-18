var mongoose = require("mongoose")
var Schema = mongoose.Schema

var ordenSchema = require("./orden")
var NVU = require("../../config/nivelesDeUrgencia")

var LaserCliente = require("../marcaLaser")

var procesosSchema = require("../procesos/procesos")

// <!--
// =====================================
//  END validaciones
// =====================================
// -->

const folioLineaSchema = new Schema(
  {
    // El número de pedido que se asigna en el pre del save. (Tambien se asigna a la órden.);
    pedido: { type: String },

    // La suma de todos los factores de modelo que se ocupan

    idSKU: { type: Schema.Types.ObjectId, ref: "sku" },
    cantidad: {
      type: Schema.Types.Number,
      required: [true, "La cantidad es necesaria"],
    },

    // Si se selecciona esta opción quiere decir que el sku
    // se tiene que surtir de almacen.
    almacen: {
      type: Boolean,
      default: false,
    },

    ordenes: [ordenSchema],
    ordenesGeneradas: { type: Boolean, default: false },
    trayectoGenerado: { type: Boolean, default: false },
    porcentajeAvance: { type: Number, min: 0, max: 100 },

    observaciones: { type: String },
    observacionesVendedor: { type: String },
    terminado: { type: Boolean, default: false },
    fechaTerminado: Date,
    cantidadProducida: { type: Number, default: 0 },
    impreso: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = folioLineaSchema
