var express = require('express');
var app = express();
var Terminado = require('../../models/terminado');


var CRUD = require('../CRUD');
CRUD.app = app;
CRUD.modelo = Terminado;
CRUD.nombreDeObjetoSingular = 'terminado';
CRUD.nombreDeObjetoPlural = 'terminados';
CRUD.campoSortDefault = 'terminado';
CRUD.camposActualizables = {
    terminado: null
};



CRUD.camposDeBusqueda = [
    'terminado',

];

CRUD.crud();




// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;