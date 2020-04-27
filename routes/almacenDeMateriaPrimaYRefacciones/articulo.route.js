var express = require("express")
var app = express()
var Articulo = require("../../models/almacenRefaccionesYMateriaPrima/articulo.model")

var RESP = require("../../utils/respStatus")

var guard = require("express-jwt-permissions")()
var permisos = require("../../config/permisos.config")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.post("/", permisos.$("articulo:crear"), (req, res) => {
  return new Articulo(req.body)
    .save()
    .then(articulo => {
      return RESP._200(res, "Se guardo el articulo", [
        { tipo: "articulo", datos: articulo },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error guardando el articulo"))
})

app.get("/", permisos.$("articulo:leer:todo"), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")

  const total = await Articulo.countDocuments().exec()

  Articulo.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(articulos => {
      return RESP._200(res, null, [
        { tipo: "articulos", datos: articulos },
        { tipo: "total", datos: total },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando los articulos"))
})

app.get("/buscar/id/:id", permisos.$("articulo:leer:id"), (req, res) => {
  Articulo.findById(req.params.id)
    .exec()
    .then(articulo => {
      if (!articulo) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "articulo", datos: articulo }])
    })
    .catch(err =>
      erro(res, err, "Hubo un error buscando el articulo por su id")
    )
})

app.get(
  "/buscar/termino/:termino",
  permisos.$("articulo:leer:termino"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombre")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" },
    })

    const $match = {
      $or: [],
    }

    ;[
      "codigoLocalizacion",
      "codigoInterno",
      "codigoProveedor",
      "nombre",
      "descripcion",
      "observaciones",
      "presentacion",
      "unidad",
      "kgPorUnidad",
      "proveedores",
      "stockMaximo",
      "stockMinimo",
    ].forEach(x => $match.$or.push(b(x)))

    const total = await Articulo.aggregate([
      { $match },
      { $count: "total" },
    ]).exec()

    Articulo.aggregate([
      { $match },

      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then(articulos => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "articulos", datos: articulos },
          { tipo: "total", datos: total.pop().total },
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error buscando los articulos por el termino " + termino
        )
      )
  }
)

app.put("/", permisos.$("articulo:modificar"), (req, res) => {
  Articulo.findById(req.body._id)
    .exec()
    .then(articulo => {
      if (!articulo) {
        throw "No existe el articulo"
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
        "cuentas",
        "codigoLocalizacion",
        "codigoInterno",
        "codigoProveedor",
      ].forEach(x => {
        articulo[x] = req.body[x]
      })

      return articulo.save()
    })
    .then(articulo => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "articulo", datos: articulo },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error actualizando el articulo"))
})

app.delete("/:id", permisos.$("articulo:eliminar"), (req, res) => {
  Articulo.findById(req.params.id)
    .exec()
    .then(articulo => {
      if (!articulo) throw "No existe el articulo"

      return articulo.remove()
    })
    .then(articulo => {
      return RESP._200(res, "Se elimino de manera correcta", [
        { tipo: "articulo", datos: articulo },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando el articulo"))
})

function errF(res, tex) {
  return err =>
    RESP._500(res, {
      msj: `Hubo un error al registrar la ${tex} para este articulo.`,
      err: err,
    })
}

function correcto(res) {
  return articuloGuardado =>
    RESP._200(res, null, [{ tipo: "articulo", datos: articuloGuardado }])
}

app.put("/entrada/:id", (req, res) => {
  let idArticulo = req.params.id
  let datos = req.body

  Articulo.findById({ _id: idArticulo })
    .exec()
    .then(articulo => {
      guardarEntrada(articulo, datos)

      return articulo.save()
    })
    .then(correcto(res))
    .catch(errF(res, "entrada"))
})

/**
 *Guarda una entrada nueva y comproueba si el articulo existe.
 *
 * @param {*} articulo El schema.
 * @param {*} datos Los datos de entradaMateriaPrimaYRefacciones
 */
function guardarEntrada(articulo, datos) {
  if (!articulo) throw "No existe un articulo con este id."

  if (!articulo.entradas) articulo.entradas = []
  articulo.entradas.push(datos)
  articulo.existencia = (articulo.existencia + datos.cantidad * 1).toPrecision(
    3
  )
}

app.put("/salida/:id", (req, res) => {
  let idArticulo = req.params.id
  let datos = req.body

  Articulo.findById({ _id: idArticulo })
    .exec()
    .then(articulo => {
      guardarSalida(articulo, datos)

      return articulo.save()
    })
    .then(correcto(res))
    .catch(errF(res, "salida"))
})

/**
 *Guarda una entrada nueva y comproueba si el articulo existe.
 *
 * @param {*} articulo El schema.
 * @param {*} datos Los datos de entradaMateriaPrimaYRefacciones
 */
function guardarSalida(articulo, datos) {
  if (!articulo) throw "No existe un articulo con este id."

  if (!articulo.salidas) articulo.salidas = []
  articulo.salidas.push(datos)
  articulo.existencia = (articulo.existencia - datos.cantidad).toPrecision(3)
}

app.put("/stock/:id", (req, res) => {
  let id = req.params.id
  let datos = req.body
  Articulo.findById(id)
    .exec()
    .then(articulo => modificarStock(articulo, datos))
    .then(articuloGuardado =>
      RESP._200(res, "Se modifico el stock de manera correcta.", [
        { tipo: "articulo", datos: articuloGuardado },
      ])
    )
    .catch(err =>
      RESP._500(res, {
        msj: "Hubo un error actualizando el stock.",
        err: err,
      })
    )
})

function modificarStock(articulo, datos) {
  if (!articulo) throw "No existe el articulo."

  articulo.stockMinimo = datos.stockMinimo
  articulo.stockMaximo = datos.stockMaximo

  return articulo.save()
}

module.exports = app
