const express = require("express")
const app = express()

// const bcrypt = require("bcryptjs")
// // const Usuario = require("../../models/usuario.model")
// const jwt = require("jsonwebtoken")
// const SEED = process.env.SEED
// const Parametros = require("../../models/defautls/parametros.model")
// const pjson = require("../../package.json")
// const obtenerMenu = require("./login.menus")
// const $ = require("@codice-progressio/easy-permissions").$
// const permisos = require("../../seguridad/permisos.seguridad")

// function crearToken(usuario) {
//   delete usuario.password
//   const objeto = {
//     ...usuario,
//     menu: obtenerMenu(usuario.permissions),
//     apiVersion: pjson.version,
//   }

//   //Una hora 3600
//   const hora = 3600

//   let data = JSON.stringify({ ...objeto })
//   data = JSON.parse(data.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
//   return jwt.sign(data, SEED, {
//     // expiresIn: 3600 * 2,
//     expiresIn: hora * 2,
//   })
// }

// app.post("/renuevatoken", (req, res, next) => {
//   Usuario.findById(req.user._id)
//     .select("+passsword +permissions")
//     .lean()
//     .exec()
//     .then(usuario => {
//       if (!usuario) throw "No se renovo la sesion"
//       let token = crearToken(usuario)
//       return res.send({ token })
//     })
//     .catch(err => {
//       next(err)
//     })
// })

// app.post("/", (req, res, next) => {
//   var body = req.body
//   Usuario.findOne({ email: body.email })
//     .populate("empleado", "nombres apellidos fotografia")
//     .select("+password +permissions")
//     .lean()
//     .exec()
//     .then(usuarioDB => {
//       if (!usuarioDB) throw "Credenciales incorrectas"

//       if (!body.password) throw "El password no debe estar vacio."

//       if (!bcrypt.compareSync(body.password, usuarioDB.password))
//         throw "Credenciales incorrectas"

//       // crear un token!
//       if (!usuarioDB.permissions) usuarioDB.permissions = []
//       var token = crearToken(usuarioDB)
//       usuarioLogueado = usuarioDB

//       let e = usuarioDB.empleado
//       if (e) {
//         usuarioDB.nombre = e.nombres + " " + e.apellidos
//         usuarioDB.img = e.fotografia
//       }

//       return res.send({ token })
//     })
//     .catch(err => next(err))
// })

// // Retorna todos los roles que hay en la api.
// app.get("/permisos", $("SUPER_ADMIN"), (req, res) => {
//   return res.send(permisos)
// })

module.exports = app
