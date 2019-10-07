var mongoose = require("mongoose")
var Schema = mongoose.Schema
// var ImagenesFacturasSchema = require("./imagenesFacturas.model.js")

var StatusRequisicionSchema = new Schema({
  esRequisicion: { type: Boolean, default: true },
  esOrdenDeCompra: Boolean,
  fechaDeGeneracionDeOrdenDeCompra: Date,
  fechaTermino: Date,

  esEntregaParcial: Boolean,
  fechaEntregaParcialidad: Date,
  cantidadEntregadaALaFecha: { type: Number, default: 0 },
  //Se completo la cantidad especificada
  // en la requisicion.
  esTerminada: Boolean,
  imagenesFacturas: [{
    imagen: String,
    fecha: Date
}],

  esCancelada: Boolean,
  fechaCancelacion: Date,
  motivoCancelacion: String
})

module.exports = StatusRequisicionSchema
