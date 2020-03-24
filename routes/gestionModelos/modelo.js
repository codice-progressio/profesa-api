var express = require("express")
var app = express()
var Modelo = require("../../models/modelo")
var RESP = require("../../utils/respStatus")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.post("/", (req, res) => {
  return new Modelo(req.body)
    .save()
    .then(modelo => {
      return RESP._200(res, "Se guardo el modelo", [
        { tipo: "modelo", datos: modelo }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error guardando el modelo"))
})

app.get("/", async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "modelo")

  const total = await Modelo.countDocuments().exec()

  Modelo.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(modelo => {
      return RESP._200(res, null, [
        { tipo: "modelos", datos: modelo },
        { tipo: "total", datos: total }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando los modelos"))
})

app.get("/:id", (req, res) => {
  Modelo.findById(req.params.id)
    .exec()
    .then(modelo => {
      if (!modelo) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "modelo", datos: modelo }])
    })
    .catch(err => erro(res, err, "Hubo un error buscando el modelo por su id"))
})

app.get("/buscar/:termino", async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "modelo")
  const termino = String(
    req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  )
  const b = campo => ({
    [campo]: { $regex: termino, $options: "i" }
  })

  const $match = {
    $or: []
  }

  ;["modelo"].forEach(x => $match.$or.push(b(x)))

  const total = await Modelo.aggregate([{ $match }, { $count: "total" }]).exec()

  Modelo.aggregate([
    { $match },

    //Fin de populacion

    { $sort: { [campo]: sort } },
    //Desde aqui limitamos unicamente lo que queremos ver
    { $limit: desde + limite },
    { $skip: desde },
    { $sort: { [campo]: sort } }
  ])
    .exec()
    .then(modelos => {
      //Si no hay resultados no se crea la propiedad
      // y mas adelante nos da error.
      if (!total.length) total.push({ total: 0 })

      return RESP._200(res, null, [
        { tipo: "modelos", datos: modelos },
        { tipo: "total", datos: total.pop().total }
      ])
    })
    .catch(err =>
      erro(
        res,
        err,
        "Hubo un error buscando los modelos por el termino " + termino
      )
    )
})

app.delete("/:id", (req, res) => {
  Modelo.findById(req.params.id)
    .exec()
    .then(modelo => {
      if (!modelo) throw "No existe el modelo"

      return modelo.remove()
    })
    .then(modelo => {
      return RESP._200(res, "Se elimino de manera correcta", [
        { tipo: "modelo", datos: modelo }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando el modelo"))
})

app.put("/", (req, res) => {
  Modelo.findById(req.body._id)
    .exec()
    .then(modelo => {
      if (!modelo) throw "No existe el modelo"
      ;["modelo"].forEach(x => (modelo[x] = req.body[x]))

      return modelo.save()
    })
    .then(modelo => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "modelo", datos: modelo }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error actualizando el modelo"))
})


module.exports = app
