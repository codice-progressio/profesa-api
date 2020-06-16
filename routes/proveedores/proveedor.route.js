//Esto es necesario
var express = require("express")
var app = express()
var Proveedor = require("../../models/proveedores/proveedor.model")
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

app.post("/", permisos.$("proveedor:crear"), (req, res) => {
  return new Proveedor(req.body)
    .save()
    .then(proveedor => {
      return RESP._200(res, "Se guardo el proveedor", [
        { tipo: "proveedor", datos: proveedor }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error guardando el proveedor"))
})

app.get(
  "/",
  permisos.$("proveedor:leer:todo"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombre")

    const total = await Proveedor.countDocuments().exec()

    Proveedor.find()
      .sort({ [campo]: sort })
      .limit(limite)
      .skip(desde)
      .exec()
      .then(proveedores => {
        return RESP._200(res, null, [
          { tipo: "proveedores", datos: proveedores },
          { tipo: "total", datos: total }
        ])
      })
      .catch(err => erro(res, err, "Hubo un error buscando las proveedores"))
  }
)

app.get("/:id", permisos.$("proveedor:leer:id"), (req, res) => {
  Proveedor.findById(req.params.id)
    .exec()
    .then(proveedor => {
      if (!proveedor) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "proveedor", datos: proveedor }])
    })
    .catch(err =>
      erro(res, err, "Hubo un error buscando el proveedor por su id")
    )
})

app.get(
  "/buscar/:termino",
  permisos.$("proveedor:leer:termino"),
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

    ;["nombre", "razonSocial", "rfc"].forEach(x => $match.$or.push(b(x)))

    const total = await Proveedor.aggregate([
      { $match },
      { $count: "total" }
    ]).exec()

    Proveedor.aggregate([
      { $match },

      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } }
    ])
      .exec()
      .then(proveedores => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "proveedores", datos: proveedores },
          { tipo: "total", datos: total.pop().total }
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error buscando las proveedores por el termino " + termino
        )
      )
  }
)

app.put("/", permisos.$("proveedor:modificar"), (req, res) => {
  Proveedor.findById(req.body._id)
    .exec()
    .then(proveedor => {
      if (!proveedor) {
        throw "No existe el proveedor"
      }

      ;[
        "nombre",
        "razonSocial",
        "domicilios",
        "contactos",
        "tiempoDeEntregaEstimadoEnDias",
        "relacionArticulos",
        "rfc",
        "metodosDePagoAceptados",
        "condicionesDePago",
        "formasDePago",
        "cuentas"
      ].forEach(x => {
        proveedor[x] = req.body[x]
      })

      return proveedor.save()
    })
    .then(proveedor => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "proveedor", datos: proveedor }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error actualizando el proveedor"))
})

app.delete(
  "/:id",
  permisos.$("proveedor:eliminar"),
  (req, res) => {
    Proveedor.findById(req.params.id)
      .exec()
      .then(proveedor => {
        if (!proveedor) throw "No existe el proveedor"

        return proveedor.remove()
      })
      .then(proveedor => {
        return RESP._200(res, "Se elimino de manera correcta", [
          { tipo: "proveedor", datos: proveedor }
        ])
      })
      .catch(err => erro(res, err, "Hubo un error eliminando el proveedor"))
  }
)

// <!--
// =====================================
//  Buscador todos los elementos relacionados con el proveedor
// =====================================
// -->

app.get("/relacionadosAlArticulo/:id", (req, res) => {
  Proveedor.find({ "relacionArticulos.item": req.params.id })
    .exec()
    .then(proveedores => {
      return RESP._200(res, null, [{ tipo: "proveedores", datos: proveedores }])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error buscando los proveedores relacionados al articulo",
        err: err
      })
    })
})

// <!--
// =====================================
//  END Buscador todos los elementos relacionados con el proveedor
// =====================================
// -->

module.exports = app
