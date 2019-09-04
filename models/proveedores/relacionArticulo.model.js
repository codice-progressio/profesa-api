var mongoose = require("mongoose")
var Schema = mongoose.Schema

const RelacionArticuloSchema = new Schema({
  precioUnitario: {
    type: Number,
    require: [true, "Es necesario que definas el precio"]
  },
  // Esta divisa la debe de contener el proveedor.
  divisa: {
    type: Schema.Types.ObjectId,
    ref: "Divisa",
    require: [true, "La moneda es necesaria."]
  },

  item: {
    type: Schema.Types.ObjectId,
    ref: "Articulo",
    require: [true, "Es necesario el articulo"]
  },

  tiempoDeEntregaEnDias: {
    type: Number
  },

  prioridad: {
    type: Number,
    min: [1, "El valor de prioridad mas alto debe de ser 1"],
    max: [3, "El valor de prioridad mas bajo debe de ser 3"],
    default: 1
  }
})

module.exports = RelacionArticuloSchema
