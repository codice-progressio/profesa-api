const mongoose = require("mongoose")
const Schema = mongoose.Schema

const PerfilDePuestoSchema = new Schema({
  conocimientos: [String],
  habilidades: [String],
  aptitudes: [String]
})

module.exports = PerfilDePuestoSchema
