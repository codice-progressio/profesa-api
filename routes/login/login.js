const express = require("express")
const app = express()

const bcrypt = require("bcryptjs")
const Usuario = require("../../models/usuario")
const jwt = require("jsonwebtoken")
const SEED = require("../../config/config").SEED
const CONST = require("../../utils/constantes")
const RESP = require("../../utils/respStatus")

// Google

const pjson = require("../../package.json")

const obtenerMenu = require("./login.menus")

var guard = require("express-jwt-permissions")()
var permisos = require("../../config/permisos.config")

// ============================================
// Autenticación de google.
// ============================================

app.get("/renuevatoken", (req, res) => {
  throw "Pendiende de implementacin"
})

app.post("/", (req, res) => {
  var body = req.body
  Usuario.findOne({ email: body.email })
    .lean()
    .exec()
    .then((usuarioDB) => {
      if (!usuarioDB) throw "Credenciales incorrectas"

      if (!body.password) throw "El password no debe estar vacio."

      if (!bcrypt.compareSync(body.password, usuarioDB.password))
        throw "Credenciales incorrectas"

      // crear un token!
      delete usuarioDB.password
      var token = jwt.sign({ ...usuarioDB }, SEED, {
        expiresIn: 14400,
      })

      return RESP._200(res, `Bienvenido ${usuarioDB.nombre}`, [
        { tipo: "usuario", datos: usuarioDB },
        { tipo: "token", datos: token },
        { tipo: "id", datos: usuarioDB.id },
        { tipo: "menu", datos: obtenerMenu(usuarioDB.permissions) },
        { tipo: "apiVersion", datos: pjson.version },
      ])
    })
    .catch((err) => {
      return RESP._500(res, {
        msj: "Hubo un error en el login.",
        err: err,
      })
    })
})

// Retorna todos los roles que hay en la api.
app.get("/roles", guard.check(permisos.$("SUPER_ADMIN")), (req, res) => {
  let roles = CONST.ROLES

  RESP._200(res, null, [{ tipo: "roles", datos: roles }])
})

module.exports = app
