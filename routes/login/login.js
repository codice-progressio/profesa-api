const express = require("express")
const app = express()

const bcrypt = require("bcryptjs")
const Usuario = require("../../models/usuario")
const jwt = require("jsonwebtoken")
const SEED = require("../../config/config").SEED
const CONST = require("../../utils/constantes")
const RESP = require("../../utils/respStatus")
const Parametros = require("../../models/defautls/parametros.model")

// Google

const pjson = require("../../package.json")

const obtenerMenu = require("./login.menus")

var guard = require("express-jwt-permissions")()
var permisos = require("../../config/permisos.config")

function crearToken(usuario) {
  return jwt.sign({ ...usuario }, SEED, {
    //Una hora 3600
    expiresIn: 3600 * 2,
  })
}

app.post("/renuevatoken", (req, res) => {
  Usuario.findById(req.user._id)
    .select("+passsword")
    .lean()
    .exec()
    .then(usuario => {
      if (!usuario) throw "No se renovo la sesion"

      let token = crearToken(usuario)
      return RESP._200(res, "Se renovo la sesion", [
        { tipo: "token", datos: token },
      ])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error en el login.",
        err: err,
      })
    })
})

app.post("/", (req, res) => {
  var body = req.body
  var datos = []
  var usuarioLogueado = null
  Usuario.findOne({ email: body.email })
    .select("+password")
    .lean()
    .exec()
    .then(usuarioDB => {
      if (!usuarioDB) throw "Credenciales incorrectas"

      if (!body.password) throw "El password no debe estar vacio."

      if (!bcrypt.compareSync(body.password, usuarioDB.password))
        throw "Credenciales incorrectas"

      // crear un token!
      delete usuarioDB.password
      var token = crearToken(usuarioDB)
      usuarioLogueado = usuarioDB
      datos = [
        { tipo: "usuario", datos: usuarioDB },
        { tipo: "token", datos: token },
        { tipo: "id", datos: usuarioDB.id },
        { tipo: "menu", datos: obtenerMenu(usuarioDB.permissions) },
        { tipo: "apiVersion", datos: pjson.version },
      ]

      return Parametros.findOne({})
        .populate("estacionesDeEscaneo.departamento", null, "Departamento")
        .exec()
    })
    .then(parametros => {
      let estacionesDeEscaneo = parametros.estacionesDeEscaneo

      const menu = {
        titulo: "Registros",
        icono: "fas fa-qrcode",
        submenu: [],
      }

      //Comprobar que el usuario tiene asignado algun menu.
      estacionesDeEscaneo
        .filter(estacion =>
          estacion.usuarios.includes(usuarioLogueado._id.toString())
        )
        .forEach(estacion => {
          menu.submenu.push({
            titulo: estacion.departamento.nombre,
            url: `/escaner/${estacion.departamento.nombre}/${estacion.departamento._id}`,
            permiso: permisos.$("login", false),
          })
        })

      datos.find(x => x.tipo === "menu").datos.push(menu)

      return RESP._200(res, `Bienvenido ${usuarioLogueado.nombre}`, datos)
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error en el login.",
        err: err,
      })
    })
})

// Retorna todos los roles que hay en la api.
app.get("/permisos", permisos.$("SUPER_ADMIN"), (req, res) => {
  RESP._200(res, null, [{ tipo: "permisos", datos: permisos.lista }])
})

module.exports = app
