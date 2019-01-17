//Esto es necesario
var express = require('express');
var app = express();
var Defaults = require('../../models/configModels/default');
var RESP = require('../../utils/respStatus');



app.get('/', (req, res) => {
    // Solo obtiene los defaults. 

    Defaults.find().then(resp => {
            if (resp.length === 0) {
                return RESP._500(res, {
                    msj: 'Hubo un error fatal!!!',
                    err: 'No hay datos por default. No podras continuar.',
                });
            }

            return RESP._200(res, null, [
                { tipo: 'defaults', datos: resp[0] },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error cargando los datos por default',
                err: err,
            });
        });

});


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;