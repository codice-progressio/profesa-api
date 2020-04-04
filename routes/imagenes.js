//Esto es necesario
var express = require('express');
var app = express();

const path = require('path');
const fs = require('fs');

var guard =  require('express-jwt-permissions')()
var permisos = require('../config/permisos.config')

app.get('/:tipo/:img', guard.check(permisos.$('imagenes:tipo:ver')), (req, res, next) => {

    var tipo = req.params.tipo;
    var img = req.params.img;

    //__dirname Obtiene toda la ruta de donde nos encontramos actualmente.
    var pathImagen = path.resolve(__dirname, `../uploads/${tipo}/${img}`);
    // Si la imagen existe
    if (fs.existsSync(pathImagen)) {
        res.sendFile(pathImagen);
    } else {
        res.sendFile(imgNoExiste());
    }

});

app.get('/*', (req, res, next) => {
    res.sendFile(imgNoExiste());
});

function imgNoExiste() {
    return path.resolve(__dirname, `../assets/no-img.jpg`);

}

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;