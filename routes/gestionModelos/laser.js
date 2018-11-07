//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../../utils/colors");
var RESP = require('../../utils/respStatus');
var MarcaLaser = require('../../models/marcaLaser');



app.get('/', (req, res, next) => {
    var promise = MarcaLaser.find({}).exec();

    promise.then(marcasLaser => {
        if (!marcasLaser) {
            return RESP._400(res, {
                msj: 'No has registrado aun ningúna marca laser.',
                err: 'Es necesario que registres una marca laser.. ',
            });
        }

        return RESP._200(res, null, [
            { tipo: 'marcasLaser', datos: marcasLaser },
        ]);

    }).catch(err => {
        console.log(colores.danger('ERROR') + err);
        return RESP._500(res, {
            msj: 'Hubo un error buscando las marcas laser.',
            err: err,
        });
    });


});

app.put('/', (req, res, next) => {

    var promise = MarcaLaser.findById(req.body._id).exec();
    promise.then(marcaLaser => {
            if (!marcaLaser) {
                return RESP._400(res, {
                    msj: 'No existe la marca laser.',
                    err: 'El id que ingresaste no existe.',
                });
            }
            marcaLaser.laser = req.body.laser;
            marcaLaser.imagenes = req.body.imagenes;

            return marcaLaser.save();
        }).then(marcaLaser => {
            return RESP._200(res, 'Se modifico correctamente la marca laser.', [
                { tipo: 'terminado', datos: marcaLaser },
            ]);
        })
        .catch(err => {
            console.log(colores.danger('ERROR') + err);
            return RESP._500(res, {
                msj: 'Hubo un error actualizando la marca laser.',
                err: err,
            });
        });


});


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;