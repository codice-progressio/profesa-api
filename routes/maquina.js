var express = require('express');
var app = express();
var Maquina = require('../models/maquina');


var CRUD = require('./CRUD');
CRUD.app = app;
CRUD.modelo = Maquina;
CRUD.nombreDeObjetoSingular = 'maquina';
CRUD.nombreDeObjetoPlural = 'maquinas';
CRUD.campoSortDefault = 'clave';
CRUD.camposActualizables = {
    // estandar: null,
};

CRUD.camposDeBusqueda = [
    'nombre',
    'clave',
    'nombresAnteriores.nombre',
    'nombresAnteriores.clave',
    'observaciones',

];

CRUD.camposActualizables = {
    nombre: null,
    clave: null,
    anio: null,
    departamentos: null,
    numeroDeSerie: null,
    observaciones: null,
};



CRUD.crud();


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;