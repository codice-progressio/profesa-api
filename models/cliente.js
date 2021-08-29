var mongoose = require("mongoose")
var Schema = mongoose.Schema
var uniqueValidator = require("mongoose-unique-validator")

var clienteSchema = new Schema(
  {
    nombre: {
      type: String,
      unique: true,
      required: [true, "El	nombre	es	necesario"],
    },
    listaDePrecios: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listaDePrecios",
    },
  },

  { collection: "clientes" }
)

clienteSchema.plugin(uniqueValidator, {
  message: "El campo '{PATH}' debe ser único.",
})

module.exports = mongoose.model("Cliente", clienteSchema)
