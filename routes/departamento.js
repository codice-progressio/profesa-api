var express = require("express");
var app = express();
var colores = require("../utils/colors");
var Departamento = require("../models/departamento");


var CRUD = require('../routes/CRUD');
CRUD.app = app;
CRUD.modelo = Departamento;
CRUD.nombreDeObjetoSingular = 'departmento';
CRUD.nombreDeObjetoPlural = 'departmentos';
CRUD.campoSortDefault = 'nombre';
CRUD.camposActualizables = {
    nombre: null,
};



CRUD.camposDeBusqueda = [
    'nombre',
];

CRUD.crud();



// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;