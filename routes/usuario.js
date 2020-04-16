// Requires
var express = require("express")
var colores = require("../utils/colors")
var bcrypt = require("bcryptjs")
var Usuario = require("../models/usuario")
var CONST = require("../utils/constantes")
var RESP = require("../utils/respStatus")


var app = express()

var guard = require("express-jwt-permissions")()
var permisos = require("../config/permisos.config")

// ============================================
// Obtener todos los usuarios.
// ============================================
app.get(
  "/",
  guard.check(permisos.$("administrador:usuario:leer")),
  (req, res, next) => {
    var desde = req.query.desde || 0
    desde = Number(desde)

    Usuario.find({}, "nombre email img role google")
      //Se salta los primeros "desde" registros y carga los siguientes.
      .skip(desde)
      // Liminta la cantidad de registros que se van a mostrar.
      .limit(5)
      .exec((err, usuarios) => {
        if (err) {
          return res.status(500).json({
            ok: true,
            mensaje: "Error cargando usuarios.",
            errors: err,
          })
        }

        // Esta función cuenta la cantidad de registros que existen.
        // Estos datos se pasan en el json para llevar la paginación.
        Usuario.count({}, (err, conteo) => {
          // Si no sucede ningún error.
          res.status(200).json({
            ok: true,
            usuarios: usuarios,
            total: conteo - 1,
          })
        })

        console.log(colores.info("GET") + " Petición correcta: Usuarios")
      })
  }
)

// ============================================
// Actualizar usuario
// ============================================
app.put("/:id", guard.check(permisos.$("usuario:modificar")), (req, res) => {
  var id = req.params.id
  var body = req.body

  //Eliminamos todos los roles que no existen.
  body.role = body.role.filter((rol) => CONST.ROLES.ARRAY.includes(rol))
  Usuario.findById(id)
    .exec()
    .then((u) => {
      if (!u) {
        return RESP._400(res, {
          msj: "El usuario no existe. ",
          err: "El id que ingresaste no esta registrado con ningún usuario.",
        })
      }

      u.nombre = body.nombre
      u.email = body.email

      // Si se agrega un password si se modifica MIENTRAS NO SEA SUPER ADMIN.
      if (body.password) {
        u.password = bcrypt.hashSync(body.password, 10)
      }

      return u.save()
    })
    .then((uG) => {
      uG.password = ":D"
      return RESP._200(
        res,
        `Se actualizo el usuario ${uG.nombre} correctamente.`,
        [{ tipo: "usuario", datos: uG }]
      )
    })
    .catch((err) => {
      return RESP._500(res, {
        msj: "Hubo un error actualizando el usuario.",
        err: err,
      })
    })
})

// ============================================
// Crear un nuevo usuario.
// ============================================
app.post(
  "/",
  guard.check(permisos.$("administrador:usuario:crear")),
  (req, res) => {
    var body = req.body

    var usuario = new Usuario({
      nombre: body.nombre,
      email: body.email,
      password: bcrypt.hashSync(body.password ? body.password : "", 10),
      img: body.img,
      role: body.role,
      idTrabajador: body.idTrabajador,
    })

    console.log(usuario)

    usuario
      .save()
      .then((uGuardado) => {
        console.log(" Esta aqua")

        return RESP._200(
          res,
          `Usuario '${uGuardado.nombre}' creado con éxito.`,
          [
            { tipo: "usuario", datos: uGuardado },
            { tipo: "usuarioToken", datos: req.usuario },
          ]
        )
      })
      .catch((err) => {
        console.log(err)

        return RESP._500(res, {
          msj: "Hubo un error guardando el usuario.",
          err: err,
        })
      })


  }
)

// ============================================
// Borrar un usuario por el ID
// ============================================

app.delete(
  "/:id",
  guard.check(permisos.$("administrador:usuario:eliminar")),
  (req, res) => {
    var id = req.params.id

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
      if (err) {
        var msj = "Error al borrar usuario"
        console.log(
          colores.danger("Error DELETE - Usuario") + `${msj} =>` + err
        )
        return res.status(500).json({
          ok: false,
          mensaje: `${msj}`,
          errors: err,
        })
      }

      if (!usuarioBorrado) {
        var msj2 = "No existe un usuario con ese id."

        console.log(
          colores.danger("Error DELETE - Usuario") + `${msj2} =>` + err
        )
        return res.status(400).json({
          ok: false,
          mensaje: msj2,
          errors: { message: msj2 },
        })
      }

      console.log(colores.info("DELETE") + " Petición correcta: Usuarios")
      res.status(200).json({
        ok: true,
        usuario: usuarioBorrado,
      })
    })
  }
)

app.put(
  "/roles",

  guard.check(permisos.$("administrador:usuario:roles")),

  (req, res) => {
    Usuario.findById(req.body._id)
      .exec()
      .then((usuario) => {
        if (!usuario) throw "No existe el usuario"

        while (usuario.permissions > 0) usuario.permissions.pop()

        req.body.forEach((x) => usuario.permissions.push(x))

        return usuario.save()
      })
      .then((usuario) => {
        return RESP._200(res, "Se modificaron los roles del usuario", [{}])
      })
      .catch((err) => next(err))
  }
)

module.exports = app
