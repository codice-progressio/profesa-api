var express = require('express');
var app = express();


app.get('/', (req, res, next) => {

    return RESP._200(res, 'Mensaje para interfaz ó null', [
        { tipo: 'El nombre que recivira el dato', datos: 'El dato u objeto' },
    ]);

});



module.exports = app;