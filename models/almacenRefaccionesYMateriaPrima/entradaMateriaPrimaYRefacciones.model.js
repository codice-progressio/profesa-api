var mongoose = require("mongoose")

var Schema = mongoose.Schema

var EntradaMateriaPrimaYRefacciones = new Schema({
  fecha: { type: Date, default: Date.now },
  cantidad: {
    type: Number,
    min: [0, "La cantidad de entrada no puede ser menor que 0"]
  },
  observaciones: String
})

module.exports = EntradaMateriaPrimaYRefacciones
