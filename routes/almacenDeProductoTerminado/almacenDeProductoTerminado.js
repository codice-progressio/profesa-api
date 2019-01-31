let express = require('express');
let app = express();

var ModeloCompleto = require('../../models/modeloCompleto');
var CRUD = require('../CRUD');

CRUD.app = app;
CRUD.modelo = ModeloCompleto;
CRUD.nombreDeObjetoSingular = 'modeloCompleto';
CRUD.nombreDeObjetoPlural = 'modelosCompletos';
CRUD.campoSortDefault = 'nombreCompleto';
CRUD.camposDeBusqueda = [
    'nombreCompleto',
];



/**
 * Excluimmos de aqui por que las consultas para el almacen
 * de producto termiando no requieren tanta informacion del modelo
 * completo. 
 */

CRUD.excluir = [
    'medias',
    'modelo',
    'tamano',
    'color',
    'terminado',
    'laserAlmacen',
    'versionModelo',
    'familiaDeProcesos',
    'procesosEspeciales',
    'porcentajeDeMerma',
    'espesor',
    'actualizarLotesYExistencias'
];

CRUD.crud(
    'get',
    'getBuscar'
);


module.exports = app;