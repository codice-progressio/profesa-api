const mongoose = require("mongoose")
const Schema = mongoose.Schema

const HistorialDePuestoSchema = new Schema({
  fechaDeCambio: { type: Date, default: Date.now },
  usuarioQueModifica: {
    type: Schema.Types.ObjectId,
    ref: "Usuario"
  },
  cambioAnterior: {}
})

module.exports = HistorialDePuestoSchema
