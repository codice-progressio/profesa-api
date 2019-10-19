//Esto es necesario
var express = require("express")
var app = express()
var AreaRH = require("../../../models/recursosHumanos/areas/areaRH.model")


var CRUD = require("../../CRUD")
CRUD.app = app
CRUD.modelo = AreaRH
CRUD.nombreDeObjetoSingular = "area"
CRUD.nombreDeObjetoPlural = "areas"
CRUD.campoSortDefault = "nombre"
CRUD.camposActualizables = {
    nombre: null,
}

CRUD.camposDeBusqueda = [
    'nombre',
]

CRUD.crud()


module.exports = app
