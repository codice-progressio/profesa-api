//Esto es necesario
var express = require('express');
var app = express();
var Hit = require('../../models/procesos/ingenieria/hit/hit');
var CRUD = require('../CRUD');


CRUD.app = app;
CRUD.modelo = Hit;
CRUD.nombreDeObjetoSingular = 'hit';
CRUD.nombreDeObjetoPlural = 'hits';
CRUD.campoSortDefault = 'codigo';
CRUD.camposActualizables = {
    codigo: "",
    operacion: "",
    area: "",
    cliente: "",
    realizo: "",
    controlDeCalidad: '',
    secuenciaDeOperacion: '',
    verificaciones: '',
    saludSeguridadMedioAmbiente: '',
};



CRUD.camposDeBusqueda = [
    'codigo',
    'operacion',
    'area',
    'cliente.nombre',
    'realizo.nombre',
];

CRUD.crud();




// CRUD.get(Hit, app, nombreDeObjeto.plurar, campoSortDefault);
// CRUD.getById(Hit, app, nombreDeObjeto.singular);
// CRUD.getBuscar(Hit, app, nombreDeObjeto.plurar, camposDeBusqueda, campoSortDefault);
// CRUD.post(Hit, app, nombreDeObjeto.singular);
// CRUD.put(Hit, app, nombreDeObjeto.plurar, camposActualizables);
// CRUD.delete(Hit, app, nombreDeObjeto.plurar);



// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;