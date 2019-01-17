//Esto es necesario
var express = require('express');
var app = express();
var FamiliaDeProceso = require('../models/procesos/familiaDeProcesos');
var ModeloCompleto = require('../models/modeloCompleto');
var Proceso = require('../models/procesos/proceso');
var colores = require("../utils/colors");
var RESP = require('../utils/respStatus');
var Departamento = require('../models/departamento');
var CONSTANSTES = require('../utils/constantes');

var CRUD = require('../routes/CRUD');


CRUD.app = app;
CRUD.modelo = Proceso;
CRUD.nombreDeObjetoSingular = 'proceso';
CRUD.nombreDeObjetoPlural = 'procesos';
CRUD.campoSortDefault = 'nombre';
CRUD.camposActualizables = {
    departamento: '',
    nombre: '',
    pasos: '',
    observaciones: '',
    especial: '',
    gastos: '',
    maquinas: '',
    requiereProduccion: ''
};



CRUD.camposDeBusqueda = [
    'nombre',
    'observaciones',
];

CRUD.crud();

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;