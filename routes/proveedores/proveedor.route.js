//Esto es necesario
var express = require("express")
var app = express()
var Proveedor = require("../../models/proveedores/proveedor.model")
var RESP = require("../../utils/respStatus")

const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

var CRUD = require("../CRUD")
CRUD.app = app
CRUD.modelo = Proveedor
CRUD.nombreDeObjetoSingular = "proveedor"
CRUD.nombreDeObjetoPlural = "proveedores"
CRUD.campoSortDefault = "nombre"
CRUD.camposActualizables = {
  nombre: null,
  razonSocial: null,
  domicilios: null,
  contactos: null,
  tiempoDeEntregaEstimadoEnDias: null,
  relacionArticulos: null,
  rfc: null,
  metodosDePagoAceptados: null,
  condicionesDePago: null,
  formasDePago: null,
  cuentas: null
}

CRUD.camposDeBusqueda = ["nombre", "razonSocial", "rfc"]

CRUD.crud()

// <!--
// =====================================
//  Buscador todos los elementos relacionados con el proveedor
// =====================================
// -->

app.get("/relacionadosAlArticulo/:id", (req, res) => {
  Proveedor.find({ "relacionArticulos.item": req.params.id })
    .exec()
    .then((proveedores) => {
      return RESP._200(res, null, [{ tipo: "proveedores", datos: proveedores }])
    })
    .catch((err) => {
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
