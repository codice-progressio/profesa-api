var mongoose = require("mongoose")

let uniqueValidator = require("mongoose-unique-validator")
var Schema = mongoose.Schema


var DivisaSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es necesario"],
      unique: true
    },
    tipoDeCambio: { type: Number }
  },
  { timestamps: true, collection: "Divisas" }
)

DivisaSchema.plugin(uniqueValidator, { message: "'{PATH}' debe ser único." })


module.exports = mongoose.model("Divisa", DivisaSchema)
