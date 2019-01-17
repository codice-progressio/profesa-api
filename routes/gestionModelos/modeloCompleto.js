//Esto es necesario
var express = require('express');
var ModeloCompleto = require('../../models/modeloCompleto');
var app = express();
var colores = require('../../utils/colors');

var Modelo = require('../../models/modelo');
var Tamano = require('../../models/tamano');
var Color = require('../../models/colores/color');
var Terminado = require('../../models/terminado');



var RESP = require('../../utils/respStatus');


var CRUD = require('../CRUD');
CRUD.app = app;
CRUD.modelo = ModeloCompleto;
CRUD.nombreDeObjetoSingular = 'modeloCompleto';
CRUD.nombreDeObjetoPlural = 'modelosCompletos';
CRUD.campoSortDefault = 'nombreCompleto';
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
    'nombreCompleto',
];

CRUD.crud();

module.exports = app;