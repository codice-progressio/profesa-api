const mongoose = require("mongoose")
const Schema = mongoose.Schema
var uniqueValidator = require("mongoose-unique-validator")

const EstadoDeProceso = {
  nombre: String,
  descripcion: String,
  hora_inicio: Date,
  hora_final: Date,
  observaciones: String,
  icono: String,
}

const ArticuloPedido = {
  cantidad: Number,
  //Si aplica, se usa de lista de precio
  precio: Number,
  sku: String,
  observaciones: String,
  importe: Number,
}

const PedidoAccion = {
  accion: String,
  usuario: String,
  estadoDocumento: [EstadoDeProceso],
}

const OrdenDeVenta = new Schema(
  {
    consecutivo: {
      type: Number,
      required: [true, "El consecutivo es necesario"],
      unique: true,
    },
    eliminado: Boolean,
    contacto: String,
    usuario: String,
    articulos: [ArticuloPedido],
    observaciones: String,
    acciones: [PedidoAccion],
    listaDePreciosId: String,
    total: Number,
    iva: Number,
    importe: Number,
    folio: String, //Usuario +  fecha + hora,
    ubicacion: {
      latitud: Number,
      longitud: Number,
    },

    sincronizado: Boolean,
    estado: [EstadoDeProceso],
  },
  { timestamp: true }
)

OrdenDeVenta.plugin(uniqueValidator, {
  message: "El campo '{PATH}' debe ser único.",
})

module.exports = mongoose.model("OrdenDeVenta", OrdenDeVenta)
