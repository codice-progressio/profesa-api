//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../../utils/colors");
var RESP = require('../../utils/respStatus');
var Tamanos = require('../../models/tamano');

// ============================================
// Obtiene todos los tamaños. 
// ============================================

app.get('/', (req, res, next) => {
    var promise = Tamanos.find({}).exec();
    promise.then(tamanos => {
        if (!tamanos) {
            return RESP._400(res, {
                msj: 'No existen tamaños registrados.',
                err: 'Es necesario que registres tamaños ',
            });
        }

        return RESP._200(res, null, [
            { tipo: 'tamanos', datos: tamanos },
        ]);

    }).catch(err => {
        console.log(colores.danger('ERROR') + err);
        return RESP._500(res, {
            msj: 'Hubo un error buscando los tamaños.',
            err: err,
        });
    });

});


// ============================================
// Modificamos un tamano. 
// ============================================
app.put('/', (req, res, next) => {
    var promise = Tamanos.findById(req.body._id).exec();
    promise.then(tamano => {
        if (!tamano) {
            Promise.reject(" No existe")
            return RESP._400(res, {
                msj: 'No existe el tamaño',
                err: 'El id que ingresaste no esta en la base de datos.',
            });
        }
        tamano.tamano = req.body.tamano;
        tamano.estandar = req.body.estandar;
        return tamano.save();
    }).then(tamano => {
        return RESP._200(res, 'Se modifico correctamente el tamaño.', [
            { tipo: 'tamano', datos: tamano },
        ]);
    }).catch(err => {
        console.log(colores.danger('ERROR') + err);
        return RESP._500(res, {
            msj: 'Hubo un erro modificando el tamaño.',
            err: err,
        });

    });

});


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;