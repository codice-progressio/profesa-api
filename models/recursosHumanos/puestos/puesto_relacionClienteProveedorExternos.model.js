const mongoose = require("mongoose")
const Schema = mongoose.Schema

const PerfilDePuestoSchema = new Schema( {
    contacto: String,
    relacion: String,
    asunto: String
  })

module.exports = PerfilDePuestoSchema
