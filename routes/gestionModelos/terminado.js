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

    const desde = Number(req.query.desde || 0);
    const limite = Number(req.query.limite || 30);
    const sort = Number(req.query.sort || 1);
    const campo = String(req.query.campo || 'terminado');
    Promise.all([
            Terminado.find().limit(limite).skip(desde).sort({
                [campo]: sort
            }).exec(),
            Terminado.countDocuments()
        ]).then(resp => {
            return RESP._200(res, null, [
                { tipo: 'terminados', datos: resp[0] },
                { tipo: 'total', datos: resp[1] },
            ]);

        })
        .catch(err => {
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
        });

});

app.delete('/:id', (req, res, next) => {
    const id = req.params.id;

    Terminado.findOneAndRemove({ _id: id }).exec().then(eliminado => {

            if (!eliminado) {
                return RESP._400(res, {
                    msj: 'No existe el terminado.',
                    err: 'El id del terminado que ingresaste no esta registrado en la BD.',
                });
            }
            return RESP._200(res, `Se elimino de manera correcta el terminado ${eliminado.terminado}`, [
                { tipo: 'terminado', datos: eliminado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error eliminando el terminado.',
                err: err,
            });
        });
});


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;