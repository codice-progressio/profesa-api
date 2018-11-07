//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../utils/colors");
var RESP = require('../utils/respStatus');


app.get('/', (req, res, next) => {

    // res.status(200).json({
    //     ok: true,
    //     mensaje: 'Petición realizada correctamente'
    // });
    RESP._200(res, 'El mensaje de aceptacion', [
        { tipo: 'El nombre que recivira el dato', datos: 'El dato u objeto' },
    ]);

});

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;