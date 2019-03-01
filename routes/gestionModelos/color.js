var express = require('express');
var app = express();
var Color = require('../../models/colores/color');


var CRUD = require('../CRUD');
CRUD.app = app;
CRUD.modelo = Color;
CRUD.nombreDeObjetoSingular = 'color';
CRUD.nombreDeObjetoPlural = 'colores';
CRUD.campoSortDefault = 'color';
CRUD.camposActualizables = {
    receta: null,
    color: null
};



CRUD.camposDeBusqueda = [
    'color',
    // 'receta',

];

CRUD.crud();


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

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;