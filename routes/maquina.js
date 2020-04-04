var express = require("express")
var app = express()
var Maquina = require("../models/maquina")

var RESP = require("../utils/respStatus")
var guard = require("express-jwt-permissions")()
var permisos = require("../config/permisos.config")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.post("/", guard.check(permisos.$("maquina:crear")), (req, res) => {
  const maquina = new Maquina(req.body)
  maquina
    .save()
    .then((maquina) => {
      return RESP._200(res, "Se guardo la maquina de manera correcta", [
        { tipo: "maquina", datos: maquina },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error guardando la maquina"))
})

app.get("/", guard.check(permisos.$("maquina:leer:todo")), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")

  const total = await Maquina.countDocuments().exec()

  Maquina.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then((maquinas) => {
      return RESP._200(res, null, [
        { tipo: "maquinas", datos: maquinas },
        { tipo: "total", datos: total },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error buscando las maquinas"))
})

// <!--
// =====================================
//  Id
// =====================================
// -->
app.get("/:id", guard.check(permisos.$("maquina:leer:id")), (req, res) => {
  Maquina.findById(req.params.id)
    .exec()
    .then((maquina) => {
      if (!maquina) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "maquina", datos: maquina }])
    })
    .catch((err) =>
      erro(res, err, "Hubo un error buscando la maquina por su id")
    )
})

// <!--
// =====================================
//  END Id
// =====================================
// -->

app.get(
  "/buscar/:termino",
  guard.check(permisos.$("maquina:leer:termino")),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombre")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = (campo) => ({
      [campo]: { $regex: termino, $options: "i" },
    })

    const $match = {
      $or: [],
    }

    ;["nombre", "clave", "numeroDeSerie", "observaciones"].forEach((x) =>
      $match.$or.push(b(x))
    )

    const total = await Maquina.aggregate([
      { $match },
      { $count: "total" },
    ]).exec()

    Maquina.aggregate([
      { $match },
      // Populacion del articulo sin entrdas ni salidas
      {
        $unwind: {
          path: "$departamentos",
        },
      },
      {
        $lookup: {
          from: "departamentos",
          localField: "departamentos",
          foreignField: "_id",
          as: "departamentos",
        },
      },
      {
        $unwind: {
          path: "$departamentos",
        },
      },
      {
        $group: {
          _id: "$_id",
          maquina: { $first: "$$ROOT" },
          departamentos: { $push: "$departamentos" },
        },
      },

      {
        $addFields: {
          "maquina.departamentos": "$departamentos",
        },
      },
      {
        $replaceRoot: { newRoot: "$maquina" },
      },

      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then((maquinas) => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "maquinas", datos: maquinas },
          { tipo: "total", datos: total.pop().total },
        ])
      })
      .catch((err) =>
        erro(
          res,
          err,
          "Hubo un error buscando las maquinas por el termino " + termino
        )
      )
  }
)

//   <!--
//   =====================================
//    Modificar
//   =====================================
//   -->
app.put("/", guard.check(permisos.$("maquina:modificar")), (req, res) => {
  Maquina.findById(req.body._id)
    .exec()
    .then((maquina) => {
      if (!maquina) {
        throw "No existe la maquina"
      }

      let a = [
        "nombre",
        "clave",
        "anio",
        "departamentos",
        "numeroDeSerie",
        "observaciones",
      ].forEach((x) => {
        maquina[x] = req.body[x]
      })

      return maquina.save()
    })
    .then((maquina) => {
      return RESP._200(res, "Se modifico correctamente la maquina", [
        { tipo: "maquina", datos: maquina },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error actualizando la maquina"))
})

//   <!--
//   =====================================
//    END Modificar
//   =====================================
//   -->

app.delete("/:id", guard.check(permisos.$("maquina:eliminar")), (req, res) => {
  Maquina.findById(req.params.id)
    .exec()
    .then((maquina) => {
      if (!maquina) throw "No existe la maquina"

      return maquina.remove()
    })
    .then((maquina) => {
      return RESP._200(res, "Se elimino de manera correcta la maquina", [
        { tipo: "maquina", datos: maquina },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error eliminando la maquina"))
})

/**
 * Este controlador obtiene las maquinas por
 * el departamento que se le pase.
 */
app.get(
  "/departamento/:id",
  guard.check(permisos.$("maquina:leer:departamento")),
  (req, res) => {
    /**
     *  El id del departamento que queremos otener sus maquinas.
     */
    const idDepto = req.params.id

    Maquina.find({ departamentos: { $all: { _id: idDepto } } })
      .exec()
      .then((maquinas) => {
        if (maquinas.length === 0) {
          throw "No hay maquinas registradas para este departamento. Para poder continuar es necesario que registres maquinas y se las asignes a este departamento."
        }

        return RESP._200(res, null, [
          {
            tipo: "maquinas",
            datos: maquinas,
          },
        ])
      })
      .catch((err) => {
        return RESP._500(res, {
          msj: "Hubo un error al obtener las maquinas para este departamento.",
          err: err,
        })
      })
  }
)

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app
