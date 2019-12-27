const express = require("express")
const app = express()

const bcrypt = require("bcryptjs")
const Usuario = require("../../models/usuario")
const jwt = require("jsonwebtoken")
const SEED = require("../../config/config").SEED
const CONST = require("../../utils/constantes")
const RESP = require("../../utils/respStatus")

// Google

const mdAutenticacion = require("../../middlewares/autenticacion")
const pjson = require("../../package.json")

const obtenerMenu = require("./login.menus")

// ============================================
// Autenticación de google.
// ============================================

app.get("/renuevatoken", mdAutenticacion.verificarToken, (req, res) => {
  var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 })

  return res.status(200).send({
    ok: true,
    token: token
  })
})

app.post("/", (req, res) => {
  var body = req.body
  Usuario.findOne({ email: body.email })
    .exec()
    .then((usuarioDB) => {
      if (!usuarioDB) {
        return RESP._400(res, {
          msj: "Credencianles incorrectas",
          err: "No se pudo loguear."
        })
      }

      if (!body.password) {
        return RESP._400(res, {
          msj: "El password no debe estar vacio.",
          err: "Parece que olvidaste escribir el password."
        })
      }

      if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
        return RESP._400(res, {
          msj: "Credencianles incorrectas",
          err: "No se pudo loguear."
        })
      }

      // crear un token!
      usuarioDB.password = ":D"
      var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 })

      return RESP._200(res, `Bienvenido ${usuarioDB.nombre}`, [
        { tipo: "usuario", datos: usuarioDB },
        { tipo: "token", datos: token },
        { tipo: "id", datos: usuarioDB.id },
        { tipo: "menu", datos: obtenerMenu(usuarioDB.role) },
        { tipo: "apiVersion", datos: pjson.version }
      ])
    })
    .catch((err) => {
      return RESP._500(res, {
        msj: "Hubo un error en el login.",
        err: err
      })
    })
})

// Retorna todos los roles que hay en la api.
app.get("/roles", (req, res) => {
  let roles = CONST.ROLES

  RESP._200(res, null, [{ tipo: "roles", datos: roles }])
})

module.exports = app
