//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../utils/colors");
var FamiliaDeProcesos = require("../models/procesos/familiaDeProcesos");




app.get('/materiales', (req, res, next) => {


    Folio.find(busqueda).populate('procesos.departamento').exec(
        (err, familiaDeProcesos) => {

            return res.status(200).json({
                err: err,
                familiaDeProcesos: familiaDeProcesos,
                mensaje: 'Petición realizada correctamente'
            });
        }
    );
});

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;