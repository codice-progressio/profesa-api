var mongoose = require("mongoose")

var Schema = mongoose.Schema

var laserSchema = new Schema(
  {
    guardar: { type: Boolean, default: false },
    trabajando: { type: Boolean },

    cantidadDeBoton: {
      type: Number,
    },

    bl: {
      type: Number,
    },
    maquinaActual: { type: Schema.Types.ObjectId, ref: "Maquina" },
  },
  { timestamps: true }
)

module.exports = laserSchema
