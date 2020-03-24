var express = require("express")
var app = express()

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.post("/", (req, res) => {
  return new Color(req.body)
    .save()
    .then(color => {
      return RESP._200(res, "Se guardo el color", [
        { tipo: "color", datos: color }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error guardando el color"))
})

app.get("/", async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "color")

  const total = await Color.countDocuments().exec()

  Color.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(color => {
      return RESP._200(res, null, [
        { tipo: "colores", datos: color },
        { tipo: "total", datos: total }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando los colores"))
})

app.get("/:id", (req, res) => {
  Color.findById(req.params.id)
    .exec()
    .then(color => {
      if (!color) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "color", datos: color }])
    })
    .catch(err => erro(res, err, "Hubo un error buscando el color por su id"))
})

app.get("/buscar/:termino", async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "color")
  const termino = String(
    req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  )
  const b = campo => ({
    [campo]: { $regex: termino, $options: "i" }
  })

  const $match = {
    $or: []
  }

  ;["color"].forEach(x => $match.$or.push(b(x)))

  const total = await Color.aggregate([{ $match }, { $count: "total" }]).exec()

  Color.aggregate([
    { $match },

    //Fin de populacion

    { $sort: { [campo]: sort } },
    //Desde aqui limitamos unicamente lo que queremos ver
    { $limit: desde + limite },
    { $skip: desde },
    { $sort: { [campo]: sort } }
  ])
    .exec()
    .then(colores => {
      //Si no hay resultados no se crea la propiedad
      // y mas adelante nos da error.
      if (!total.length) total.push({ total: 0 })

      return RESP._200(res, null, [
        { tipo: "colores", datos: colores },
        { tipo: "total", datos: total.pop().total }
      ])
    })
    .catch(err =>
      erro(
        res,
        err,
        "Hubo un error buscando los colores por el termino " + termino
      )
    )
})

app.delete("/:id", (req, res) => {
  Color.findById(req.params.id)
    .exec()
    .then(color => {
      if (!color) throw "No existe el color"

      return color.remove()
    })
    .then(color => {
      return RESP._200(res, "Se elimino de manera correcta", [
        { tipo: "color", datos: color }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando el color"))
})

app.put("/", (req, res) => {
  Color.findById(req.body._id)
    .exec()
    .then(color => {
      if (!color) throw "No existe el color"
      ;["color"].forEach(x => (color[x] = req.body[x]))

      return color.save()
    })
    .then(color => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "color", datos: color }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error actualizando el color"))
})

module.exports = app
