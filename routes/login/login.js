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

const estructuraToken = usuario => {
  const us = usuario.toObject()
  us["permissions"] = usuario.role
  return { ...us }
}

app.get("/renuevatoken", mdAutenticacion.verificarToken, (req, res) => {
  var token = jwt.sign(estructuraToken(req.usaurio), SEED, { expiresIn: 14400 })

  return res.status(200).send({
    ok: true,
    token: token
  })
})

app.post("/", (req, res) => {
  var body = req.body
  Usuario.findOne({ email: body.email })
    .exec()
    .then(usuarioDB => {
      if (!usuarioDB) throw "Credenciales incorrectas"

      if (!body.password) throw "El password no debe estar vacio."

      if (!bcrypt.compareSync(body.password, usuarioDB.password))
        throw "Credenciales incorrectas"

      // crear un token!
      usuarioDB.password = ":D"
      var token = jwt.sign(estructuraToken(usuarioDB), SEED, {
        expiresIn: 14400
      })

      return RESP._200(res, `Bienvenido ${usuarioDB.nombre}`, [
        { tipo: "usuario", datos: usuarioDB },
        { tipo: "token", datos: token },
        { tipo: "id", datos: usuarioDB.id },
        { tipo: "menu", datos: obtenerMenu(usuarioDB.role) },
        { tipo: "apiVersion", datos: pjson.version }
      ])
    })
    .catch(err => {
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
