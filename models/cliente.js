var mongoose = require("mongoose")
var Schema = mongoose.Schema
var uniqueValidator = require("mongoose-unique-validator")
var marcaLaser = require("../models/marcaLaser")

var clienteSchema = new Schema(
  {
    sae: { type: String },
    nombre: {
      type: String,
      unique: true,
      required: [true, "El	nombre	es	necesario"],
    },
    laserados: [marcaLaser],
  },
  { collection: "clientes" }
)

clienteSchema.plugin(uniqueValidator, {
  message: "El campo '{PATH}' debe ser único.",
})

module.exports = mongoose.model("Cliente", clienteSchema)
