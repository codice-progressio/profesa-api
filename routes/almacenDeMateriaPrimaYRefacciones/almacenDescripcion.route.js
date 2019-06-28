var express = require("express")
var app = express()
var AlmacenDescripcion = require("../../models/almacenRefaccionesYMateriaPrima/almacenDescripcion.model")

var CRUD = require("../CRUD")
CRUD.app = app
CRUD.modelo = AlmacenDescripcion
CRUD.nombreDeObjetoSingular = "almacenDescripcion"
CRUD.nombreDeObjetoPlural = "almacenesDescripcion"
CRUD.campoSortDefault = "nombre"
CRUD.camposActualizables = {
  // estandar: null,
}

CRUD.camposDeBusqueda = ["nombre", "descripcion", "ubicacion"]

CRUD.camposActualizables = {
  nombre: null,
  descripcion: null,
  ubicacion: null,
}

CRUD.crud()

module.exports = app

