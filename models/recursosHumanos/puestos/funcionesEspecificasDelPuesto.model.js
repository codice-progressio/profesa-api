const mongoose = require("mongoose")
const Schema = mongoose.Schema

const FuncionesEspecificasDelPuesto = new Schema({
    actividad: String,
    proposito: String,
    frecuencia: String,
    prioridad: Number
  })

module.exports = FuncionesEspecificasDelPuesto
