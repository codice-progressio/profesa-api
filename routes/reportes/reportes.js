var express = require('express');
var app = express();
var RESP = require('../../utils/respStatus');


// <!-- 
// =====================================
//  Este route se encarga de generar todos los reportes
//  que necesitamos.
// =====================================
// -->



// REPORTE DE LASER.

app.get('/laser', (req, res) => {
    // <!-- 
    // =====================================
    //  OBJETIVO DEL REPORTE. 
    // =====================================
    // -->

    // Mostrar la cantidad de ordenes pendientes
    // que tienen por laserar el departameno. 

    // <!-- 
    // =====================================
    //  Que tenemos que hacer?
    // =====================================
    // -->

    // Buscar todas las ordenes que se vayan a laserar.
    // Filtrar por aquellas que no esten terminadas.
    // Filtrar las que ya pasaron por laser. 
    // Mostrar como pendiente de surtir si viene de alamcen
    // Si viene de produccion mostrar departamentos faltantes. 

    // RETORNAMOS ORDENES. 

    return RESP._200(res, 'Mensaje para interfaz ó null', [
        { tipo: 'El nombre que recivira el dato', datos: 'El dato u objeto' },
    ]);




});

module.exports = app;