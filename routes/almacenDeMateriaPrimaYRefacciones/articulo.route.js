var express = require("express")
var app = express()
var Articulo = require("../../models/almacenRefaccionesYMateriaPrima/articulo.model")

var RESP = require("../../utils/respStatus")

var CRUD = require("../CRUD")
CRUD.app = app
CRUD.modelo = Articulo
CRUD.nombreDeObjetoSingular = "articulo"
CRUD.nombreDeObjetoPlural = "articulos"
CRUD.campoSortDefault = "nombre"

CRUD.camposDeBusqueda = [
  "codigoLocalizacion",
  "codigoInterno",
  "codigoProveedor",
  "nombre",
  "descripcion",
  "presentacion",
  "observaciones",
  
]

CRUD.camposActualizables = {
  codigoLocalizacion: null,
  codigoInterno: null,
  codigoProveedor: null,
  nombre: null,
  descripcion: null,
  observaciones: null,
  presentacion: null,
  unidad: null,
  kgPorUnidad: null,
  proveedores: null, 
  stockMaximo: null,
  stockMinimo: null
}

CRUD.crud()

function errF(res, tex) {
  return (err) =>  RESP._500(res, {
      msj: `Hubo un error al registrar la ${tex} para este articulo.`,
      err: err
    })
  
}

function correcto(res) {
  return (articuloGuardado) => 
     RESP._200(res, null, [{ tipo: "articulo", datos: articuloGuardado }])
  
}

app.put("/entrada/:id", (req, res) => {
  let idArticulo = req.params.id
  let datos = req.body

  Articulo.findById({ _id: idArticulo })
    .exec()
    .then((articulo) => {
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
  articulo.existencia = (articulo.existencia + datos.cantidad).toPrecision(3)
}

app.put("/salida/:id", (req, res) => {
  let idArticulo = req.params.id
  let datos = req.body

  Articulo.findById({ _id: idArticulo })
    .exec()
    .then((articulo) => {
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
    .then((articulo) => modificarStock(articulo, datos))
    .then((articuloGuardado) =>
      RESP._200(res, "Se modifico el stock de manera correcta.", [
        { tipo: "articulo", datos: articuloGuardado }
      ])
    )
    .catch((err) =>
      RESP._500(res, {
        msj: "Hubo un error actualizando el stock.",
        err: err
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
