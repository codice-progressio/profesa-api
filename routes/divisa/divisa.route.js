//Esto es necesario
var express = require("express")
var app = express()
var Divisa = require("../../models/divisa/divisa.model")
var RESP = require("../../utils/respStatus")

const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

var guard = require("express-jwt-permissions")()
var permisos = require("../../config/permisos.config")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.post("/", guard.check(permisos.$("divisa:crear")), (req, res) => {
  return new Divisa(req.body)
    .save()
    .then(divisa => {
      return RESP._200(res, "Se guardo la divisa", [
        { tipo: "divisa", datos: divisa }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error guardando la divisa"))
})

app.get("/", guard.check(permisos.$("divisa:leer:todo")), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")

  const total = await Divisa.countDocuments().exec()

  Divisa.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(divisas => {
      return RESP._200(res, null, [
        { tipo: "divisas", datos: divisas },
        { tipo: "total", datos: total }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando las divisas"))
})

app.get("/:id", guard.check(permisos.$("divisa:leer:id")), (req, res) => {
  Divisa.findById(req.params.id)
    .exec()
    .then(divisa => {
      if (!divisa) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "divisa", datos: divisa }])
    })
    .catch(err => erro(res, err, "Hubo un error buscando la divisa por su id"))
})

app.get(
  "/buscar/:termino",
  guard.check(permisos.$("divisa:leer:termino")),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombre")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" }
    })

    const $match = {
      $or: []
    }

    ;["nombre"].forEach(x => $match.$or.push(b(x)))

    const total = await Divisa.aggregate([
      { $match },
      { $count: "total" }
    ]).exec()

    Divisa.aggregate([
      { $match },

      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } }
    ])
      .exec()
      .then(divisas => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "divisas", datos: divisas },
          { tipo: "total", datos: total.pop().total }
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error buscando las divisas por el termino " + termino
        )
      )
  }
)

app.put("/", guard.check(permisos.$("divisa:modificar")), (req, res) => {
  Divisa.findById(req.body._id)
    .exec()
    .then(divisa => {
      if (!divisa) {
        throw "No existe el divisa"
      }

      let a = ["nombre", "tipoDeCambio"].forEach(x => {
        divisa[x] = req.body[x]
      })

      return divisa.save()
    })
    .then(divisa => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "divisa", datos: divisa }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error actualizando la divisa"))
})

app.delete("/:id", guard.check(permisos.$("divisa:eliminar")), (req, res) => {
  Divisa.findById(req.params.id)
    .exec()
    .then(divisa => {
      if (!divisa) throw "No existe la divisa"

      return divisa.remove()
    })
    .then(divisa => {
      return RESP._200(res, "Se elimino de manera correcta", [
        { tipo: "divisa", datos: divisa }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando la divisa"))
})

module.exports = app
