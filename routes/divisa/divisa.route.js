//Esto es necesario
var express = require("express")
var app = express()
var DivisaSchema = require("../../models/divisa/divisa.model")
var RESP = require("../../utils/respStatus")

const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

var CRUD = require("../CRUD")
CRUD.app = app
CRUD.modelo = DivisaSchema
CRUD.nombreDeObjetoSingular = "divisa"
CRUD.nombreDeObjetoPlural = "divisas"
CRUD.campoSortDefault = "nombre"
CRUD.camposActualizables = {
  nombre: null,
  tipoDeCambio: null,
}

CRUD.camposDeBusqueda = [
  "nombre",
]

CRUD.crud()


module.exports = app