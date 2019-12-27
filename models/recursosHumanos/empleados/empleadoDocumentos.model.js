const mongoose = require("mongoose")
const Schema = mongoose.Schema


const EmpleadoDocumentosSchema = new Schema({
  actaDeNacimento: String, // img
  comprobanteDeDomicilio: String, //img
  ine: String, // img
  constanciaDeAntecedentesNoPenales: String, // img
  licenciaDeManejo: String, // img
  cartasDeRecomendacion: [String], // IMG
  comprabantesDeEstudios: [String] // IMG
})

module.exports = EmpleadoDocumentosSchema
