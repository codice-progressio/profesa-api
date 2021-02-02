// Requires
const express = require("express")
const bcrypt = require("bcryptjs")
const Usuario = require("../models/usuario.model")
const Empleado = require("../models/recursosHumanos/empleados/empleado.model")
const easyImages = require("@codice-progressio/easy-images")

const app = express()

const $ = require("@codice-progressio/easy-permissions").$
const PERMISOS = require("../seguridad/permisos.seguridad")

// ============================================
// Obtener todos los usuarios.
// ============================================
app.get(
  "/",
  $("administrador:usuario:leer", "Leer los usuarios existentes"),
  async (req, res, next) => {
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
  }
)

// ============================================
// Actualizar usuario (Nombre, email)
// ============================================
app.put(
  "/",
  $("administrador:usuario:modificar", "Modificar datos básicos de un usuario"),
  (req, res, next) => {
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
  }
)

// Actualizar password
app.put(
  "/password",
  $(
    "administrador:usuario:modificar:password",
    "Modificar el password de un usuario"
  ),
  (req, res, next) => {
    Usuario.findById(req.body._id)
      .select("+password")
      .exec()
      .then(u => {
        if (!u) throw "No existe el id"

        // Solo el super admin se puede modificar a si mismo
        // el password

        const userLogueadoEsSuperAdmin =
          req.parametros.super.id === req.user._id
        const userBuscadoEsSuperAdmin = u._id === req.user._id

        if (userBuscadoEsSuperAdmin && !userLogueadoEsSuperAdmin)
          throw "No tienes permiso de modificar el password para este usuario"

        bcrypt.hash(req.body.password, 10, function (err, hash) {
          u.password = hash
          u.save()
            .then(u2 => {
              u.password = ":D"
              return res.send(u2)
            })
            .catch(_ => next(_))
        })
      })
      .catch(_ => next(_))
  }
)

app.put(
  "/agregar-permisos",
  $(
    "administrador:usuario:modificar:agregar-permisos",
    "Agregar permisos a un usuario"
  ),
  (req, res, next) => {
    Usuario.findById(req.body._id)
      .select("+permissions")
      .exec()
      .then(u => {
        if (!u) throw "No existe el id"
        // Solo agregamos los permisos en listados
        let permisos = Array.from(
          new Set(req.body.permissions.concat(u.permissions))
        ).filter(x => Object.keys(PERMISOS).includes(x))
        // Removemos todo para poder agregar
        while (u.permissions.length > 0) u.permissions.pop()
        permisos.forEach(x => u.permissions.push(x))
        return u.save()
      })
      .then(u => res.send(u))
      .catch(_ => next(_))
  }
)

app.put(
  "/imagen",
  $("usuario:modificar:agregar-imagen", "Agregar una imagen al usuario"),
  easyImages.recibirImagen.single("img"),
  easyImages.redimencionarMiddleware,
  async (req, res, next) => {
    let us = await Usuario.findById(req.body._id).exec()
    if (!us) throw new Error("No existe el id")
    //Eliminamos la imagen actual si existe.
    if (us.img?.nombreBD) {
      try {
        await easyImages.eliminarImagenDeBucket(us.img?.nombreBD)
      } catch (error) {
        return next(error)
      }
    }
    // Subimos la imagen nueva
    easyImages
      .subirImagen(req.file)
      .then(data => {
        // Sustituimos los datos de la anterior imagen con
        // los nuevos
        us.img = {
          nombreOriginal: req.file.originalname,
          nombreBD: data.nuevoNombre,
          path: data.publicUrl,
        }
        return us.save()
      })
      .then(usuario => res.send(usuario))
      .catch(_ => next(_))
  }
)

//Eliminamos una imagen
app.delete(
  "/imagen/:id",
  $("usuario:modificar:eliminar-imagen", "Elimina la imagen del usuario"),
  async (req, res, next) => {
    // El id del sku
    const id = req.params.id
    // Buscamos por id
    const usuario = await Usuario.findById(id).exec()
    easyImages
      .eliminarImagenDeBucket(usuario.img.nombreBD)
      .then(respuesta => {
        usuario.img = null
        return usuario.save()
      })
      .then(usuario => res.send())
      .catch(_ => next(_))
  }
)

app.put(
  "/eliminar-permiso",
  $(
    "administrador:usuario:modificar:eliminar-permiso",
    "Eliminar permisos de un usuario"
  ),
  (req, res, next) => {
    Usuario.findById(req.body._id)
      .select("+permissions")
      .exec()
      .then(u => {
        if (!u) throw "No existe el id"
        u.permissions.pull(req.body.permission)
        return u.save()
      })
      .then(u => res.send(u))
      .catch(_ => next(_))
  }
)

// ============================================
// Crear un nuevo usuario.
// ============================================
app.post(
  "/",
  $("administrador:usuario:crear", "Crear un usuario"),
  (req, res, next) => {
    //   comprobarEmpleadoActivo(req.body.empleado, req.body.permissions)
    bcrypt.hash(req.body.password, 10, function (err, hash) {
      req.body.password = hash
      delete req.body._id
      new Usuario(req.body)
        .save()
        .then(x => {
          x.password = ":D"
          return res.send(x)
        })
        .catch(_ => next(_))
    })
  }
)

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

app.delete(
  "/:id",
  $("administrador:usuario:eliminar", "Eliminar un usuario"),
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
  $(
    "administrador:usuario:leer:termino",
    "Buscar un usuario por un termino de busqueda"
  ),
  async (req, res, next) => {
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" },
    })

    const $match = {
      $or: [],
    }

    ;["nombre", "email"].forEach(x => $match.$or.push(b(x)))

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
        return res.send(usuarios)
      })
      .catch(err => next(err))
  }
)

app.get(
  "/buscar/id/:id",
  $("administrador:usuario:leer:id", "Buscar un usuario por su id"),
  (req, res) => {
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
  }
)

app.get(
  "/buscar/todo/light",
  $(
    "administrador:usuario:leer:todo:ligero",
    "Obtener todos los usuarios solo con los datos más basicos. "
  ),
  (req, res, next) => {
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
  }
)
module.exports = app
