const mongoose = require("mongoose")
const Schema = mongoose.Schema
const RutaDeEntregaSchema = new Schema({
  nombre: {
    type: String,
    min: [4, "El nombre debe contener cuatro letras o mas"],
    required: [true, "Debes definir un nombre para la ruta"],
  },
  descripcion: String,
})

module.exports = mongoose.model("rutaDeEntrega", RutaDeEntregaSchema)
