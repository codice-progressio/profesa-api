var mongoose = require("mongoose")
var Schema = mongoose.Schema
var ImagenesFacturasSchema = require("./imagenesFacturas.model.JS")

var StatusRequisicionSchema = new Schema({
  esRequisicion: { type: Boolean, default: true },
  esOrdenDeCompra: Boolean,
  fechaDeGeneracionDeOrdenDeCompra: Date,
  fechaTerminoYEntradaAlmacen: Date,

  esEntregaParcial: Boolean,
  fechaEntregaParcialidad: Date,
  cantidadEntregadaALaFecha: { type: Number, default: 0 },
  //Se completo la cantidad especificada
  // en la requisicion.
  esTerminada: Boolean,
  fechaTerminada: Date,
  imagenesFacturas: [ImagenesFacturasSchema],

  esCancelada: Boolean,
  fechaCancelacion: Date,
  motivoCancelacion: String
})

module.exports = StatusRequisicionSchema
