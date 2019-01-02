//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../../utils/colors");
var RESP = require('../../utils/respStatus');
var Modelo = require('../../models/modelo');
var ModeloCompleto = require('../../models/modeloCompleto');
var Cliente = require('../../models/cliente');

var Folio = require('../../models/folios/folio');

app.get('/', (req, res, next) => {

    const desde = Number(req.query.desde || 0);
    const limite = Number(req.query.limite || 30);
    const sort = Number(req.query.sort || 1);
    const campo = String(req.query.campo || 'modelo');



    Promise.all([
            Modelo.find().limit(limite).skip(desde).sort({
                [campo]: sort
            }).exec(),
            Modelo.countDocuments()
        ]).then(resp => {
            return RESP._200(res, null, [
                { tipo: 'modelos', datos: resp[0] },
                { tipo: 'total', datos: resp[1] },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error buscando los modelos.',
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

app.post('/', (req, res, next) => {
    var datos = req.body;
    var modelo = new Modelo(datos);


    modelo.save(datos).then(modeloNuevo => {
            return RESP._200(res, `Se guardo de manera correcta el modelo ${modeloNuevo.modelo}.`, [
                { tipo: 'modelo', datos: modeloNuevo },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error guardando el modelo nuevo.',
                err: err,
            });
        });
});

app.delete('/:id', (req, res, next) => {
    const id = req.params.id;

    Modelo.findOneAndRemove({ _id: id }).exec().then(eliminado => {

            if (!eliminado) {
                return RESP._400(res, {
                    msj: 'No existe el modelo.',
                    err: 'El id del modelo que ingresaste no esta registrado en la BD.',
                });
            }
            return RESP._200(res, `Se elimino de manera correcta el modelo ${eliminado.modelo}`, [
                { tipo: 'modelo', datos: eliminado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error eliminando el modelo.',
                err: err,
            });
        });
});




// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;