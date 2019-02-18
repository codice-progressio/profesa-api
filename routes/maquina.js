var express = require('express');
var app = express();
var Maquina = require('../models/maquina');

var RESP = require('../utils/respStatus')
var Departamento = require('../models/departamento');




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

/**
 * Este controlador obtiene las maquinas por 
 * el departamento que se le pase. 
 */
app.get('/departamento/:id', (req, res) => {

    /**
     *  El id del departamento que queremos otener sus maquinas. 
     */
    const idDepto = req.query.id;

    // Existe el departamento. 
    Departamento.findOne({ _id: idDepto })
        .exec()
        .then(depto => {
            if (!depto) {
                return RESP._500(res, {
                    msj: 'El departamento no existe. ',
                    err: 'El id del departamento que ingresaste no existe.',
                });
            }

            return Maquina.find({ 'departamentos._id': idDepto })
                .exec();

        }).then(maquinas => {
            if (maquinas.length === 0) {
                return RESP._400(res, {
                    msj: 'No hay maquinas registradas para este departamento.',
                    err: 'Para poder continuar es necesario que registres maquinas para este departamento.',
                });
            }


            return RESP._200(res, null, [
                { tipo: CRUD.nombreDeObjetoPlural, datos: maquinas },
            ]);


        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error al obtener las maquinas para este departamento.',
                err: err,
            });
        });


});



// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;