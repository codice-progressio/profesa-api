var mongoose = require("mongoose")

var Schema = mongoose.Schema

var cantidades = {
  peso10Botones: { type: Number },
  pesoTotalBoton: { type: Number },
  espesorPastilla: { type: Number },
}

var pastillaSchema = new Schema(
  {
    guardar: { type: Boolean, default: false },
    trabajando: { type: Boolean, default: false },
    cantidades: [cantidades],
    conto: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
    },
  },
  { timestamps: true }
)
module.exports = pastillaSchema
