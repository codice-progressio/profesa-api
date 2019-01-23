var express = require('express');
var app = express();
var Modelo = require('../../models/modelo');


var CRUD = require('../CRUD');
CRUD.app = app;
CRUD.modelo = Modelo;
CRUD.nombreDeObjetoSingular = 'modelo';
CRUD.nombreDeObjetoPlural = 'modelos';
CRUD.campoSortDefault = 'modelo';
CRUD.camposActualizables = {
    // estandar: null,
};



CRUD.camposDeBusqueda = [
    'modelo',

];

CRUD.crud();


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;