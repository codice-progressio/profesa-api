//Esto es necesario
var express = require("express")
var app = express()
var Area = require("../../../models/recursosHumanos/areas/areaRH.model")

var guard = require("express-jwt-permissions")()
var permisos = require("../../../config/permisos.config")
var RESP = require('../../../utils/respStatus')

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.post("/", permisos.$("area:crear"), (req, res) => {
  return new Area(req.body)
    .save()
    .then(area => {
      return RESP._200(res, "Se guardo el area", [
        { tipo: "area", datos: area }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error guardando el area"))
})

app.get("/", permisos.$("area:leer:todo"), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")

  const total = await Area.countDocuments().exec()

  Area.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(areas => {
      return RESP._200(res, null, [
        { tipo: "areas", datos: areas },
        { tipo: "total", datos: total }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando las areas"))
})

app.get("/:id", permisos.$("area:leer:id"), (req, res) => {
  Area.findById(req.params.id)
    .exec()
    .then(area => {
      if (!area) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "area", datos: area }])
    })
    .catch(err => erro(res, err, "Hubo un error buscando el area por su id"))
})

app.get(
  "/buscar/:termino",
  permisos.$("area:leer:termino"),
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

    const total = await Area.aggregate([{ $match }, { $count: "total" }]).exec()

    Area.aggregate([
      { $match },

      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } }
    ])
      .exec()
      .then(areas => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "areas", datos: areas },
          { tipo: "total", datos: total.pop().total }
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error buscando las areas por el termino " + termino
        )
      )
  }
)

app.put("/", permisos.$("area:modificar"), (req, res) => {
  Area.findById(req.body._id)
    .exec()
    .then(area => {
      if (!area) {
        throw "No existe el area"
      }

      let a = ["nombre"].forEach(x => {
        area[x] = req.body[x]
      })

      return area.save()
    })
    .then(area => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "area", datos: area }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error actualizando el area"))
})

app.delete("/:id", permisos.$("area:eliminar"), (req, res) => {
  Area.findById(req.params.id)
    .exec()
    .then(area => {
      if (!area) throw "No existe el area"

      return area.remove()
    })
    .then(area => {
      return RESP._200(res, "Se elimino de manera correcta", [
        { tipo: "area", datos: area }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando el area"))
})

module.exports = app
