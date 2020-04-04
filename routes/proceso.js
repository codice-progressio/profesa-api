//Esto es necesario
var express = require("express")
var app = express()
var Proceso = require("../models/procesos/proceso")
var RESP = require("../utils/respStatus")

var guard = require("express-jwt-permissions")()
var permisos = require("../config/permisos.config")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.post("/", guard.check(permisos.$("proceso:crear")), (req, res) => {
  return new Proceso(req.body)
    .save()
    .then((proceso) => {
      return RESP._200(res, "Se guardo el proceso", [
        { tipo: "proceso", datos: proceso },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error guardando el proceso"))
})

app.get("/", guard.check(permisos.$("proceso:leer:todo")), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")

  const total = await Proceso.countDocuments().exec()

  Proceso.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then((procesos) => {
      return RESP._200(res, null, [
        { tipo: "procesos", datos: procesos },
        { tipo: "total", datos: total },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error buscando los procesos"))
})

app.get("/:id", guard.check(permisos.$("proceso:leer:id")), (req, res) => {
  Proceso.findById(req.params.id)
    .exec()
    .then((proceso) => {
      if (!proceso) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "proceso", datos: proceso }])
    })
    .catch((err) =>
      erro(res, err, "Hubo un error buscando el proceso por su id")
    )
})

app.get(
  "/buscar/:termino",
  guard.check(permisos.$("proceso:leer:termino")),
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

    ;["nombre", "observaciones", "departamento.nombre"].forEach((x) =>
      $match.$or.push(b(x))
    )

    const total = await Proceso.aggregate([
      { $match },
      { $count: "total" },
    ]).exec()

    Proceso.aggregate([
      // Populacion del articulo sin entrdas ni salidas

      {
        $lookup: {
          from: "departamentos",
          localField: "departamento",
          foreignField: "_id",
          as: "departamento",
        },
      },
      {
        $unwind: {
          path: "$departamento",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $unwind: { path: "$maquinas", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "maquinas",
          localField: "maquinas",
          foreignField: "_id",
          as: "maquinas",
        },
      },
      {
        $unwind: {
          path: "$maquinas",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          proceso: { $first: "$$ROOT" },
          maquinas: { $push: "$maquinas" },
        },
      },

      {
        $addFields: {
          "proceso.maquinas": "$maquinas",
        },
      },
      {
        $replaceRoot: { newRoot: "$proceso" },
      },

      { $match },

      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then((procesos) => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "procesos", datos: procesos },
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

app.put("/", guard.check(permisos.$("proceso:modificar")), (req, res) => {
  Proceso.findById(req.body._id)
    .exec()
    .then((proceso) => {
      if (!proceso) {
        throw "No existe el proceso"
      }

      let a = [
        "departamento",
        "nombre",
        "pasos",
        "observaciones",
        "especial",
        "gastos",
        "maquinas",
        "requiereProduccion",
      ].forEach((x) => {
        proceso[x] = req.body[x]
      })

      return proceso.save()
    })
    .then((proceso) => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "proceso", datos: proceso },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error actualizando el proceso"))
})

app.delete("/:id", guard.check(permisos.$("proceso:eliminar")), (req, res) => {
  Proceso.findById(req.params.id)
    .exec()
    .then((proceso) => {
      if (!proceso) throw "No existe el proceso"

      return proceso.remove()
    })
    .then((proceso) => {
      return RESP._200(res, "Se elimino de manera correcta", [
        { tipo: "proceso", datos: proceso },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error eliminando el proceso"))
})

app.post(
  "/buscar_multiple",
  guard.check(permisos.$("proceso:leer:multiple")),
  (req, res) => {
    Proceso.find({ _id: { $in: req.body.busqueda } })
      .exec()
      .then((procesos) => {
        return RESP._200(res, null, [{ tipo: "procesos", datos: procesos }])
      })
      .catch((err) => erro(res, err, "Hubo un error buscando los procesos"))
  }
)

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app
