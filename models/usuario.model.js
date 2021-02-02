const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")
const $ = require("@codice-progressio/easy-permissions").$
const Schema = mongoose.Schema

const usuarioSchema = new Schema({
  nombre: { type: String, min:4},
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
    default: [
      $(
        "login",
        "Permite loguear al usuario. Remover este permiso impedira que el usuario inicie sesión.",
        { esMiddleware: false }
      ),
    ],
    select: false,
  },
})

usuarioSchema.plugin(uniqueValidator, {
  message: " El email ya esta registrado.",
})

module.exports = mongoose.model("Usuario", usuarioSchema)
