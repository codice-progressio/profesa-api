//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../../utils/colors");
var RESP = require('../../utils/respStatus');
var VersionModelo = require('../../models/versionModelo');

app.get('/', (req, res, next) => {

    var promise = VersionModelo.find({}).exec();

    promise.then(versionModelos => {
        if (!versionModelos) {
            return RESP._400(res, {
                msj: 'No has registrado aun ningúna version de modelo.',
                err: 'Es neceseario que registres una versión de modelo.',
            });
        }

        return RESP._200(res, null, [
            { tipo: 'versionModelos', datos: versionModelos },
        ]);

    }).catch(err => {
        console.log(colores.danger('ERROR') + err);
        return RESP._500(res, {
            msj: 'Hubo un error buscando versiones.',
            err: err,
        });
    });

});

app.put('/', (req, res, next) => {

    var promise = VersionModelo.findById(req.body._id).exec();
    promise.then(versionModelo => {
            if (!versionModelo) {
                return RESP._400(res, {
                    msj: 'No existe la versión.',
                    err: 'El id que ingresaste no existe.',
                });
            }
            versionModelo.versionModelo = req.body.versionModelo;

            return versionModelo.save();
        }).then(versionModelo => {
            return RESP._200(res, 'Se modifico correctamente la versión.', [
                { tipo: 'versionModelo', datos: versionModelo },
            ]);
        })
        .catch(err => {
            console.log(colores.danger('ERROR') + err);
            return RESP._500(res, {
                msj: 'Hubo un error actualizando la versión.',
                err: err,
            });
        });
});


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;