var express = require('express');
var app = express();
var Tamano = require('../../models/tamano');


var CRUD = require('../CRUD');
CRUD.app = app;
CRUD.modelo = Tamano;
CRUD.nombreDeObjetoSingular = 'tamano';
CRUD.nombreDeObjetoPlural = 'tamanos';
CRUD.campoSortDefault = 'tamano';
CRUD.camposActualizables = {
    estandar: null,
};



CRUD.camposDeBusqueda = [
    'tamano',
    'estandar'

];

CRUD.crud();





// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;