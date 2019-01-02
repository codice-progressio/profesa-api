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
    const desde = Number(req.query.desde || 0);
    const limite = Number(req.query.limite || 30);
    const sort = Number(req.query.sort || 1);
    const campo = String(req.query.campo || 'tamano');

    Promise.all([
            Color.find().limit(limite).skip(desde).sort({
                [campo]: sort
            }).exec(),
            Color.countDocuments()
        ]).then(resp => {
            return RESP._200(res, null, [
                { tipo: 'colores', datos: resp[0] },
                { tipo: 'total', datos: resp[1] },
            ]);

        })
        .catch(err => {
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

app.delete('/:id', (req, res, next) => {
    const id = req.params.id;

    Color.findOneAndRemove({ _id: id }).exec().then(eliminado => {

            if (!eliminado) {
                return RESP._400(res, {
                    msj: 'No existe el color.',
                    err: 'El id del color que ingresaste no esta registrado en la BD.',
                });
            }
            return RESP._200(res, `Se elimino de manera correcta el color ${eliminado.color}`, [
                { tipo: 'color', datos: eliminado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error eliminando el color.',
                err: err,
            });
        });
});



// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;