//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../../utils/colors");
var RESP = require('../../utils/respStatus');
var Color = require('../../models/colores/color');



// ============================================
// Obtiene todos los colores. 
// ============================================

app.get('/', (req, res, next) => {
    var promise = Color.find({}).exec();
    promise.then(colores => {
            if (!colores) {
                return RESP._400(res, {
                    msj: 'No has registrado aun ningún color.',
                    err: 'Es necesario que registres colores.',
                });
            }
            return RESP._200(res, null, [
                { tipo: 'colores', datos: colores },
            ]);

        })
        .catch(err => {
            console.log(colores.danger('ERROR') + err);
            return RESP._500(res, {
                msj: 'Hubo un error buscando los colores.',
                err: err,

            });
        });
});

// ============================================
// Modificamos un color. 
// ============================================

app.put('/', (req, res, next) => {
    var promise = Color.findById(req.body._id).exec();
    promise.then(color => {
            if (!color) {
                return RESP._400(res, {
                    msj: 'No existe el color.',
                    err: 'El id que ingresaste no existe.',
                });
            }
            color.color = req.body.color;
            return color.save();
        }).then(color => {
            return RESP._200(res, 'Se modifico el color de manera correcta.', [
                { tipo: 'color', datos: color },
            ]);

        })
        .catch(err => {
            console.log(colores.danger('ERROR') + err);
            return RESP._500(res, {
                msj: 'Hubo un erro actualizando el color',
                err: err,
            });
        });

});

// ============================================
// Añadimos una receta al color.
// ============================================

app.put('/receta', (req, res) => {

    const c = Color.findById(req.body._id).exec();

    c.then(col => {
        if (!col) {
            return RESP._400(res, {
                msj: 'No existe el color.',
                err: 'El id que ingresaste no es valido.',
            });
        }

        col.receta = req.body;
        return col.save();

    }).then(colorGuardado => {

        return RESP._200(res, 'Se modifico la receta del color correctamente.', [
            { tipo: 'color', datos: colorGuardado },
        ]);

    }).catch(err => {
        console.log(colores.danger('ERROR') + err);

        return RESP._500(res, {
            msj: 'Hubo un error modificando la receta del color.',
            err: err,
        });
    });
});



// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;