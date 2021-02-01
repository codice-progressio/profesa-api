const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const Schema = mongoose.Schema

const usuarioSchema = new Schema({
  nombre: { type: String },
  email: {
    type: String,
    unique: true,
    required: [true, "El correo es necesario."],
  },
  password: {
    type: String,
    required: [true, "La contraseña es necesaria."],
    select: false,
  },
  img: require("./imagen.model"),
  permissions: {
    type: [String],
    default: ["login"],
    select: false,
  },
})

usuarioSchema.plugin(uniqueValidator, {
  message: " El email ya esta registrado.",
})

module.exports = mongoose.model("Usuario", usuarioSchema)
