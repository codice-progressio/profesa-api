var express = require('express');
var app = express();
var Modelo = require('../../models/modelo');


var CRUD = require('../CRUD');
CRUD.app = app;
CRUD.modelo = Modelo;
CRUD.nombreDeObjetoSingular = 'tamano';
CRUD.nombreDeObjetoPlural = 'tamanos';
CRUD.campoSortDefault = 'tamano';
CRUD.camposActualizables = {
    medias: null,
    laserAlmacen: null,
    versionModelo: null,
    familiaDeProcesos: null,
    procesosEspeciales: null,
    nombreCompleto: null,
    porcentajeDeMerma: null,
    espesor: null,
};



CRUD.camposDeBusqueda = [
    'tamano',
    'estandar'

];

CRUD.crud();





// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;