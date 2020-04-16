var mongoose = require("mongoose")
var uniqueValidator = require("mongoose-unique-validator")
var permisos = require("../config/permisos.config")

var Schema = mongoose.Schema

var rolesValidos = {
  // TODO: Estos valores tienen que ir en el archivo config.js
  values: permisos.lista,
  message: "{VALUE} no es un rol permitido."
}

var usuarioSchema = new Schema({
  nombre: { type: String, required: [true, "El nombre es necesario."] },
  email: {
    type: String,
    unique: true,
    required: [true, "El correo es necesario."]
  },
  password: { type: String, required: [true, "La contraseña es necesaria."] },
  img: { type: String, required: false },
  // TODO: Un usuario debe poder tener varios roles.
  permissions: {
    type: [String],
    default: [permisos.$("login")]
  },
  idTrabajador: { type: Number }
})

usuarioSchema.plugin(uniqueValidator, { message: " '{PATH}' debe ser único." })

module.exports = mongoose.model("Usuario", usuarioSchema)
