const express = require("express")
const app = express()

const codice_security = require("@codice-progressio/express-authentication")
const $ = codice_security.configuraciones.easy_permissions.$
const p = codice_security.configuraciones.permisos

app.get(
  "/obtener-menus",
  $(p.login.permiso, p.login.descripcion),
  (req, res, next) => {
    // Obtenemos los permsios del usuario logueado.
    let usuario = req.user
    let menu = require("./login.menus")(usuario.permissions)
    res.send({ menu })
  }
)

module.exports = app
