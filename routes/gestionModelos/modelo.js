//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../../utils/colors");
var RESP = require('../../utils/respStatus');
var Modelo = require('../../models/modelo');


app.get('/', (req, res, next) => {

    Modelo.find({})
        .then((modelos) => {
            if (!modelos) {
                return RESP._400(res, {
                    msj: 'No hay modelos registrados.',
                    err: 'Es necesario que registres un modelo primiero.',
                });
            }


            return RESP._200(res, null, [
                { tipo: 'modelos', datos: modelos },
            ]);
        })
        .catch(err => {
            console.log(colores.danger('ERROR') + err);
            return RESP._500(res, {
                msj: 'Hubo un error buscando el modelo.',
                err: err,
            });
        });
});

app.put('/', (req, res, next) => {

    var promise = Modelo.findById(req.body._id).exec();

    promise.then((modelo) => {
            if (!modelo) {
                return RESP._400(res, {
                    msj: 'El modelo no existe.',
                    err: 'El id que ingresaste no esta registrado.',
                });
            }
            modelo.modelo = req.body.modelo;
            return modelo.save();
        })
        .then((modelo) => {
            return RESP._200(res, `Se actualizo correctamente el modelo ${modelo.modelo}`, [
                { tipo: 'modelo', datos: modelo },
            ]);
        }).catch(err => {
            console.log(colores.danger('ERROR') + err);
            return RESP._500(res, {
                msj: 'Hubo un error modificando el modelo.',
                err: err,
            });
        });

});


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;