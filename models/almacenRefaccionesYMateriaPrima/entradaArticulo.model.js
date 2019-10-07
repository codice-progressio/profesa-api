var mongoose = require("mongoose")

var Schema = mongoose.Schema

var EntradaArticulo = new Schema({
  fecha: { type: Date, default: Date.now },
  cantidad: {
    type: Number,
    min: [0, "La cantidad de entrada no puede ser menor que 0"],
    required: [true, 'Es necesario que definas la cantidad']
  },
  observaciones: String,
  requisicion: {  type: Schema.Types.ObjectId,
    ref: "Requisicion"
  
 },
})

module.exports = EntradaArticulo
