const mongoose = require("mongoose")
const Schema = mongoose.Schema

const imagenSchema = new Schema({
  nombreOriginal: String,
  nombreBD: String,
  path: String,
})

module.exports = imagenSchema
