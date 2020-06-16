var mongoose = require("mongoose")

var Schema = mongoose.Schema

var almacenDeBotonSchema = new Schema(
  {
    guardar: { type: Boolean, default: false },
    trabajando: { type: Boolean },

    cantidadDeBoton: {
      type: Number,
    },
  },
  { timestamps: true }
)

module.exports = almacenDeBotonSchema
