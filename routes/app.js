//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../utils/colors");
var RESP = require('../utils/respStatus');
var CONSTANSTES = require('../utils/constantes');

// ============================================
// Obtiene todos los procesos. ESTA ES UNA PLANTILA!!!
// ============================================

app.get('/', (req, res, next) => {
    const CONSULTAS = CONSTANSTES.consultas(req.query, 'nombre');

    Promise.all([
            Proceso.find()
            .limit(CONSULTAS.limite)
            .skip(CONSULTAS.desde)
            .sort({
                [CONSULTAS.campo]: CONSULTAS.sort
            })
            .exec(),
            Proceso.countDocuments()
        ]).then(resp => {

            return RESP._200(res, null, [
                { tipo: 'procesos', datos: resp[0] },
                { tipo: 'total', datos: resp[1] },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error cargando los procesos.',
                err: err,
            });
        });
});


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;