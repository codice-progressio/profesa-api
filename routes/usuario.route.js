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
  permisos.$("administrador:usuario:leer"),
  (req, res, next) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombre")

    Usuario.find()
      //Se salta los primeros "desde" registros y carga los siguientes.
      .skip(desde)
      // Liminta la cantidad de registros que se van a mostrar.
      .limit(limite)
      .sort({ [campo]: sort })
      .exec()
      .then(usuarios => {
        return RESP._200(res, null, [{ tipo: "usuarios", datos: usuarios }])
      })
  }
)

// ============================================
// Actualizar usuario
// ============================================
app.put(
  "/",
  permisos.$("administrador:usuario:modificar"),
  (req, res) => {
    var id = req.body._id
    var body = req.body
    //Eliminamos todos los roles que no existen.
    body.permissions = body.permissions.filter(permiso =>
      permisos.lista.includes(permiso)
    )
    Usuario.findById(id)
      .exec()
      .then(u => {
        if (!u) throw "No exise el id"

        u.nombre = body.nombre
        u.email = body.email

        while (u.permissions.length > 0) {
          u.permissions.pop()
        }

        req.body.permissions.forEach(x => u.permissions.push(x))
        if (body.password) {
          // Si se agrega un password si se modifica MIENTRAS NO SEA SUPER ADMIN.
          u.password = bcrypt.hashSync(body.password, 10)
        }
        if (u._id.toString() === req.parametros.super.id) {
          //Es super usuario, debe incluir SUPER_ADMIN y login

          if (!u.permissions.includes("SUPER_ADMIN"))
            u.permissions.push(permisos.$("SUPER_ADMIN"))

          if (!u.permissions.includes("login"))
            u.permissions.push(permisos.$("login"))
        }

        return u.save()
      })
      .then(uG => {
        uG.password = ":D"
        return RESP._200(
          res,
          `Se actualizo el usuario ${uG.nombre} correctamente.`,
          [{ tipo: "usuario", datos: uG }]
        )
      })
      .catch(err => {
        return RESP._500(res, {
          msj: "Hubo un error actualizando el usuario.",
          err: err,
        })
      })
  }
)

// ============================================
// Crear un nuevo usuario.
// ============================================
app.post(
  "/",
  permisos.$("administrador:usuario:crear"),
  (req, res) => {
    var usuario = new Usuario(req.body)
    usuario
      .save()
      .then(uGuardado => {
        return RESP._200(
          res,
          `Usuario '${uGuardado.nombre}' creado con éxito.`,
          [{ tipo: "usuario", datos: uGuardado }]
        )
      })
      .catch(err => erro(res, err, "Hubo un error creando el usuario"))
  }
)

// ============================================
// Borrar un usuario por el ID
// ============================================

app.delete(
  "/:id",
  permisos.$("administrador:usuario:eliminar"),
  (req, res) => {
    Usuario.findById(req.params.id)
      .exec()
      .then(u => {
        if (!u) throw "No existe el id"
        // No puede ser el super_admin

        if (req.parametros.super.id === u._id.toObject())
          throw "Imposible eliminar este usuario. "

        return usuario.remove()
      })
      .then(ur => {
        return RESP._200(res, "Se elimino el usuario", [
          { tipo: "ur", datos: ur },
        ])
      })
      .catch(err => erro(res, err, "Hubo un error eliminado el usuario"))
  }
)

app.get(
  "/buscar/termino/:termino",
  permisos.$("administrador:usuario:leer:termino"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombre")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" },
    })

    const $match = {
      $or: [],
    }

    ;["nombre"].forEach(x => $match.$or.push(b(x)))

    const total = await Usuario.aggregate([
      { $match },
      { $count: "total" },
    ]).exec()

    Usuario.aggregate([
      { $match },

      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then(usuarios => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "usuarios", datos: usuarios },
          { tipo: "total", datos: total.pop().total },
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          `Hubo un error buscando usuarios por el termino "${termino}"`
        )
      )
  }
)

app.get(
  "/buscar/id/:id",
  permisos.$("administrador:usuario:leer:id"),
  (req, res) => {
    Usuario.findById(req.params.id)
      .exec()
      .then(usuario => {
        if (!usuario) throw "No existe el usuario"
        return RESP._200(res, null, [{ tipo: "usuario", datos: usuario }])
      })
      .catch(err => erro(res, err, "Hubo un error buscando el usuario por id"))
  }
)
module.exports = app
