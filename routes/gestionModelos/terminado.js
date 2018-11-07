//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../../utils/colors");
var RESP = require('../../utils/respStatus');
var Terminado = require('../../models/terminado');

// ============================================
// Obtiene todos los terminados.
// ============================================

app.get('/', (req, res, next) => {
    var promise = Terminado.find({}).exec();

    promise.then(terminados => {
        if (!terminados) {
            return RESP._400(res, {
                msj: 'No has registrado aun ningún terminado.',
                err: 'Es necesario que registres un terminado. ',
            });
        }

        return RESP._200(res, null, [
            { tipo: 'terminados', datos: terminados },
        ]);

    }).catch(err => {
        console.log(colores.danger('ERROR') + err);
        return RESP._500(res, {
            msj: 'Hubo un error buscando los termiandos.',
            err: err,
        });
    });

});

app.put('/', (req, res, next) => {
    var promise = Terminado.findById(req.body._id).exec();
    promise.then(terminado => {
            if (!terminado) {
                return RESP._400(res, {
                    msj: 'No existe el terminado.',
                    err: 'El id que ingresaste no existe.',
                });
            }
            terminado.terminado = req.body.terminado;

            return terminado.save();
        }).then(terminado => {
            return RESP._200(res, 'Se modifico correctamente el terminado.', [
                { tipo: 'terminado', datos: terminado },
            ]);
        })
        .catch(err => {
            console.log(colores.danger('ERROR') + err);
            return RESP._500(res, {
                msj: 'Hubo un error actualizando el terminado.',
                err: err,
            });
        })

});


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;