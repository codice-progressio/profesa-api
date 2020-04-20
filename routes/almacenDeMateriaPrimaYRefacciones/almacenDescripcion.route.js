var express = require("express")
var app = express()
var AlmacenDescripcion = require("../../models/almacenRefaccionesYMateriaPrima/almacenDescripcion.model")

var RESP = require("../../utils/respStatus")

var guard = require("express-jwt-permissions")()
var permisos = require("../../config/permisos.config")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.get(
  "/",
  guard.check(permisos.$("almacenDescripcion:leer:todo")),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombre")

    const total = await AlmacenDescripcion.countDocuments().exec()

    AlmacenDescripcion.find({})
      .sort({ [campo]: sort })
      .skip(desde)
      .limit(limite)
      .exec()
      .then(almacenes => {
        return RESP._200(res, null, [
          { tipo: "almacenesDescripcion", datos: almacenes },
          { tipo: "total", datos: total },
        ])
      })
      .catch(err => erro(res, err, "Hubo un error buscando los almacenes"))
  }
)

app.get(
  "/:id",
  guard.check(permisos.$("almacenDescripcion:leer:id")),
  (req, res) => {
    AlmacenDescripcion.findById(req.params.id)
      .exec()
      .then(almacen => {
        if (!almacen) throw "No existe el id"
        return RESP._200(res, null, [
          { tipo: "almacenDescripcion", datos: almacen },
        ])
      })
      .catch(err => erro(res, err, "Hubo un error buscando el almacen por id"))
  }
)

app.get(
  "/buscar/:termino",
  guard.check(permisos.$("almacenDescripcion:leer:termino")),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "puesto")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )

    const $match = {
      $or: [
        {
          nombre: { $regex: termino, $options: "i" },
        },
        {
          descripcion: { $regex: termino, $options: "i" },
        },
        {
          ubicacion: { $regex: termino, $options: "i" },
        },
      ],
    }

    const total = await AlmacenDescripcion.aggregate([
      { $match },
      { $count: "total" },
    ]).exec()

    AlmacenDescripcion.aggregate([
      { $match },
      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      // Doble ordenada para no perder el estilo...
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then(almacenes => {
        console.log(`almacenes.length`, almacenes.length)
        return RESP._200(res, null, [
          { tipo: "almacenesDescripcion", datos: almacenes },
          { tipo: "total", datos: total.pop().total },
        ])
      })
      .catch(err =>
        erro(res, err, "Hubo un error buscando el almacenes por termino")
      )
  }
)

app.post(
  "/",
  guard.check(permisos.$("almacenDescripcion:crear")),
  (req, res) => {
    const alma = new AlmacenDescripcion(req.body)

    alma
      .save()
      .then(alma => {
        return RESP._200(res, "Se guardo el almacen de manera correcta", [
          { tipo: "almacenDescripcion", datos: alma },
        ])
      })
      .catch(err => erro(res, err, "Hubo un error guardando el almacen"))
  }
)

app.put(
  "/",
  guard.check(permisos.$("almacenDescripcion:modificar")),
  (req, res) => {
    const alma = req.body

    AlmacenDescripcion.findById(req.body._id)
      .exec()
      .then(almacen => {
        if (!almacen)
          throw "No existe el id"
          // Campos modificables
        ;["nombre", "descripcion", "ubicacion"].forEach(p => {
          almacen[p] = alma[p]
        })

        return almacen.save()
      })
      .then(almacen => {
        return RESP._200(res, "Se modifico el almacen de manera correcta", [
          { tipo: "almacenDescripcion", datos: almacen },
        ])
      })
      .catch(err => erro(res, err, "Hubo un error modificando el almacen"))
  }
)

app.delete(
  "/:id",
  guard.check(permisos.$("almacenDescripcion:eliminar")),
  (req, res) => {
    AlmacenDescripcion.findById(req.params.id)
      .exec()
      .then(almacen => {
        if (!almacen) throw "No existe el id"
        return almacen.remove()
      })
      .then(almacen => {
        return RESP._200(res, "Se elimino el almacen de manera correcta", [
          { tipo: "almacenDescripcion", datos: almacen },
        ])
      })
      .catch(err => erro(res, err, "Hubo un error eliminando el almacen"))
  }
)

module.exports = app
