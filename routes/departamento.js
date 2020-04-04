var express = require("express")
var app = express()
var colores = require("../utils/colors")
var Departamento = require("../models/departamento")

var guard = require("express-jwt-permissions")()
var permisos = require("../config/permisos.config")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.post("/", guard.check(permisos.$("departamento:crear")), (req, res) => {
  return new Departamento(req.body)
    .save()
    .then((departamento) => {
      return RESP._200(res, "Se guardo el departamento", [
        { tipo: "departamento", datos: departamento },
      ])
    })
    .catch((err) => erro(res, err, "Hubo un error guardando el departamento"))
})

app.get(
  "/",
  guard.check(permisos.$("departamento:leer:todo")),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombre")

    const total = await Departamento.countDocuments().exec()

    Departamento.find()
      .sort({ [campo]: sort })
      .limit(limite)
      .skip(desde)
      .exec()
      .then((departamentos) => {
        return RESP._200(res, null, [
          { tipo: "departamentos", datos: departamentos },
          { tipo: "total", datos: total },
        ])
      })
      .catch((err) =>
        erro(res, err, "Hubo un error buscando los departamentos")
      )
  }
)

app.get("/:id", guard.check(permisos.$("departamento:leer:id")), (req, res) => {
  Departamento.findById(req.params.id)
    .exec()
    .then((departamento) => {
      if (!departamento) throw "No existe el id"

      return RESP._200(res, null, [
        { tipo: "departamento", datos: departamento },
      ])
    })
    .catch((err) =>
      erro(res, err, "Hubo un error buscando el departamento por su id")
    )
})

app.get(
  "/buscar/:termino",
  guard.check(permisos.$("departamento:leer:termino")),
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

    ;["nombre"].forEach((x) => $match.$or.push(b(x)))

    const total = await Departamento.aggregate([
      { $match },
      { $count: "total" },
    ]).exec()

    Departamento.aggregate([
      { $match },

      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then((departamentos) => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "departamentos", datos: departamentos },
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

app.put("/", guard.check(permisos.$("departamento:modificar")), (req, res) => {
  Departamento.findById(req.body._id)
    .exec()
    .then((departamento) => {
      if (!departamento) {
        throw "No existe el departamento"
      }

      let a = ["nombre", "area"].forEach((x) => {
        departamento[x] = req.body[x]
      })

      return departamento.save()
    })
    .then((departamento) => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "departamento", datos: departamento },
      ])
    })
    .catch((err) =>
      erro(res, err, "Hubo un error actualizando el departamento")
    )
})

app.delete(
  "/:id",
  guard.check(permisos.$("departamento:eliminar")),
  (req, res) => {
    Departamento.findById(req.params.id)
      .exec()
      .then((departamento) => {
        if (!departamento) throw "No existe el departamento"

        return departamento.remove()
      })
      .then((departamento) => {
        return RESP._200(res, "Se elimino de manera correcta", [
          { tipo: "departamento", datos: departamento },
        ])
      })
      .catch((err) =>
        erro(res, err, "Hubo un error eliminando el departamento")
      )
  }
)

app.post(
  "/buscar_multiple",
  guard.check(permisos.$("departamento:leer:multiple")),
  (req, res) => {
    Departamento.find({ _id: { $in: req.body.busqueda } })
      .exec()
      .then((departamentos) => {
        return RESP._200(res, null, [
          { tipo: "departamentos", datos: departamentos },
        ])
      })
      .catch((err) =>
        erro(res, err, "Hubo un error buscando los departamentos")
      )
  }
)

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app
