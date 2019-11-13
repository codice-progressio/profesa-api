const mongoose = require("mongoose")
const Schema = mongoose.Schema
const PuestoSchema = require('../puestos/puesto.model')

const HistorialDePuestoSchema = new Schema({
  fechaDeCambio: { type: Date, default: Date.now },
  usuarioQueModifica: {
    type: Schema.Types.ObjectId,
    ref: "Usuario"
  },
  cambioAnterior: PuestoSchema
})

module.exports = HistorialDePuestoSchema
