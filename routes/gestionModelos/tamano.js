var express = require("express")
var app = express()
var Tamano = require("../../models/tamano")
var RESP = require("../../utils/respStatus")

var guard =  require('express-jwt-permissions')()
var permisos = require('../../config/permisos.config')

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.post("/", permisos.$("tamano:crear"), (req, res) => {
  return new Tamano(req.body)
    .save()
    .then((tamano) => {
      return RESP._200(res, "Se guardo el tamano", [
        { tipo: "tamano", datos: tamano },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error guardando el tamano"))
})

app.get("/", permisos.$("tamano:leer:todo"), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "tamano")

  const total = await Tamano.countDocuments().exec()

  Tamano.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then((tamano) => {
      return RESP._200(res, null, [
        { tipo: "tamanos", datos: tamano },
        { tipo: "total", datos: total },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error buscando los tamanos"))
})

app.get("/:id", permisos.$("tamano:leer:id"), (req, res) => {
  Tamano.findById(req.params.id)
    .exec()
    .then((tamano) => {
      if (!tamano) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "tamano", datos: tamano }])
    })
    .catch((err) =>
      erro(res, err, "Hubo un error buscando el tamano por su id")
    )
})

app.get(
  "/buscar/:termino",
  permisos.$("tamano:leer:termino"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "tamano")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = (campo) => ({
      [campo]: { $regex: termino, $options: "i" },
    })

    const $match = {
      $or: [],
    }

    ;["tamano"].forEach((x) => $match.$or.push(b(x)))

    const total = await Tamano.aggregate([
      { $match },
      { $count: "total" },
    ]).exec()

    Tamano.aggregate([
      { $match },

      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then((tamanos) => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "tamanos", datos: tamanos },
          { tipo: "total", datos: total.pop().total },
        ])
      })
      .catch((err) =>
        erro(
          res,
          err,
          "Hubo un error buscando los tamanos por el termino " + termino
        )
      )
  }
)

app.delete("/:id", permisos.$("tamano:eliminar"), (req, res) => {
  Tamano.findById(req.params.id)
    .exec()
    .then((tamano) => {
      if (!tamano) throw "No existe el tamano"

      return tamano.remove()
    })
    .then((tamano) => {
      return RESP._200(res, "Se elimino de manera correcta", [
        { tipo: "tamano", datos: tamano },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error eliminando el tamano"))
})

app.put("/", permisos.$("tamano:modificar"), (req, res) => {
  Tamano.findById(req.body._id)
    .exec()
    .then((tamano) => {
      if (!tamano) throw "No existe el tamano"
        ;["tamano", "estandar", "grTuboBaston"]
          .forEach((x) => (tamano[x] = req.body[x]))

      return tamano.save()
    })
    .then((tamano) => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "tamano", datos: tamano },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error actualizando el tamano"))
})

module.exports = app
