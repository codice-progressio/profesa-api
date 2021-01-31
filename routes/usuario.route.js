// Requires
const express = require("express")
const bcrypt = require("bcryptjs")
const Usuario = require("../models/usuario.model")
const Empleado = require("../models/recursosHumanos/empleados/empleado.model")

const app = express()

const $ = require("@codice-progressio/easy-permissions").$
const PERMISOS = require("../seguridad/permisos.seguridad")

// ============================================
// Obtener todos los usuarios.
// ============================================
app.get("/", $("administrador:usuario:leer"), async (req, res, next) => {
  Usuario.find()
    .populate("empleado", "nombres apellidos fotografia", "Empleado")
    .lean()
    .exec()
    .then(usuarios => {
      usuarios = usuarios.map(x => {
        if (x.empleado) {
          let em = x.empleado
          x.nombre = em.nombres + " " + em.apellidos
          x.img = em.fotografia
        }
        return x
      })
      return res.send(usuarios)
    })
    .catch(e => next(e))
})

// ============================================
// Actualizar usuario (Nombre, email)
// ============================================
app.put("/", $("administrador:usuario:modificar"), (req, res, next) => {
  const id = req.body._id
  const body = req.body
  Usuario.findById(id)
    .exec()
    .then(async u => {
      if (!u) throw "No exise el id"
      u.nombre = body.nombre
      u.email = body.email

      // await comprobarEmpleadoActivo(u.empleado, u.permissions)
      return u.save()
    })
    .then(u => res.send(u))
    .catch(_ => next(_))
})

// Actualizar password
app.put("/password", (req, res, next) => {
  Usuario.findById(req.body._id)
    .select("+password")
    .exec()
    .then(usuario => {
      if (!usuario) throw "No existe el id"
      usuario.password = bcrypt()
      return usuario.save()
    })
    .then(u => res.send(u))
    .catch(_ => next(_))
})

app.put("/agregar-permisos", (req, res, next) => {
  next(new Error("No deifino"))
})

// ============================================
// Crear un nuevo usuario.
// ============================================
app.post("/", $("administrador:usuario:crear"), (req, res, next) => {
  //   comprobarEmpleadoActivo(req.body.empleado, req.body.permissions)

  new Usuario(req.body)
    .save()
    .then(u => res.send(u))
    .catch(_ => next(_))
})

// ============================================
// Borrar un usuario por el ID
// ============================================

async function comprobarEmpleadoActivo(idEmpleado, permissions) {
  let empleado = await Empleado.findById(idEmpleado).exec()

  if (empleado && permissions.includes("login")) {
    //No se puede asignar un empleado

    if (!empleado.activo)
      throw "No se puede asignar un empleado en baja administrativa a un usuario activo"
  } else if (empleado) {
    throw "No se puede asignar un empleado a un usuario inactivo. Active al usuario para poder relacionarlo con un empleado. "
  }
}

app.delete("/:id", $("administrador:usuario:eliminar"), (req, res) => {
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
})

app.get(
  "/buscar/termino/:termino",
  $("administrador:usuario:leer:termino"),
  async (req, res, next) => {
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
      { $addFields: { empleado: { $toObjectId: "$empleado" } } },

      {
        $lookup: {
          from: "empleados",
          foreignField: "_id",
          localField: "empleado",
          as: "empleado",
        },
      },

      {
        $unwind: {
          path: "$empleado",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          nombre: 1,
          email: 1,
          "empleado.nombres": 1,
          "empleado.apellidos": 1,
          "empleado.fotografia": 1,
        },
      },

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then(usuarios => {
        usuarios = usuarios.map(x => {
          if (x.empleado) {
            x.nombre = x.empleado.nombres + " " + x.empleado.apellidos
            x.img = x.empleado.fotografia
          }
          return x
        })
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "usuarios", datos: usuarios },
          { tipo: "total", datos: total.pop().total },
        ])
      })
      .catch(err => next(err))
  }
)

app.get("/buscar/id/:id", $("administrador:usuario:leer:id"), (req, res) => {
  Usuario.findById(req.params.id)
    .populate("empleado", "nombres apellidos fotografia", "Empleado")
    .lean()
    .exec()
    .then(usuario => {
      if (!usuario) throw "No existe el usuario"

      if (usuario.empleado) {
        usuario.nombre =
          usuario.empleado.nombres + " " + usuario.empleado.apellidos
        usuario.img = usuario.empleado.fotografia
      }

      return RESP._200(res, null, [{ tipo: "usuario", datos: usuario }])
    })
    .catch(err => erro(res, err, "Hubo un error buscando el usuario por id"))
})

app.get("/buscar/todo/light", (req, res, next) => {
  Usuario.aggregate([
    { $match: { xxx: { $exists: false } } },

    {
      $lookup: {
        from: "empleado",
        foreignField: "_id",
        localField: "empleado",
        as: "empleado",
      },
    },

    {
      $unwind: {
        path: "$empleado",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        nombre: 1,
        "empleado.nombres": 1,
        "empleado.apellidos": 1,
        "empleado.fotografia": 1,
      },
    },
  ])
    .exec()
    .then(usuarios => {
      usuarios = usuarios.map(x => {
        if (x.empleado) {
          x.nombre = x.empleado.nombres + " " + x.empleado.apellidos
          x.img = x.empleado.fotografia
        }

        return x
      })

      return RESP._200(res, null, [{ tipo: "usuarios", datos: usuarios }])
    })
    .catch(err => next(err))
})
module.exports = app
