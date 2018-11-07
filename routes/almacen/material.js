//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../../utils/colors");
var RESP = require('../../utils/respStatus');
var Material = require('../../models/almacen/material');



// ============================================
// Otiene todos los materiales
// ============================================

app.get('/', (req, res, next) => {

    const skip = req.query.skip || 0;
    const limit = req.query.limit || 10;

    const m = Material.find().skip(skip).limit(limit).exec();

    m.then(materiales => {
        if (!materiales) {
            return RESP._400(res, {
                msj: 'No has grabado ningún material',
                err: 'Es necesario que guardes un nuevo materail.',
            });
        }

        return RESP._200(res, null, [
            { tipo: 'materiales', datos: materiales },
            { tipo: 'count', count: 20 },
        ]);
    }).catch(err => {
        console.log(colores.danger('ERROR') + err);

        return RESP._500(res, {
            msj: 'Hubo un error cargando los materiales.',
            err: err,
        });
    });
});

// ============================================
// Guarda un material nuevo.
// ============================================


app.post('/', (req, res) => {

    const mat = new Material(req.body);
    mat.save((err, materialGuardado) => {
        if (err) {
            return RESP._500(res, {
                msj: 'Hubo un error guardando el material.',
                err: err,
            });
        }
        return RESP._200(res, 'Se guardo correctamente el material.', [
            { tipo: 'material', datos: materialGuardado },
        ]);
    });
});

app.put('/', (req, res) => {
    const m = Material.findById(req.body._id).exec();

    m.then(mat => {
        if (!mat) {
            return RESP._400(res, {
                msj: 'No existe el material.',
                err: 'El id que ingresaste no existe.',
            });
        }

        mat.nombre = req.body.nombre;
        mat.costoPorUnidad = req.body.costoPorUnidad;
        mat.kgDeUnidad = req.body.kgDeUnidad;
        mat.unidadAlmacen = req.body.unidadAlmacen;
        mat.stock.min = req.body.stock.min;
        mat.stock.max = req.body.stock.max;
        mat.tipo = req.body.tipo;

        return mat.save();

    }).then(matModificado => {
        return RESP._200(res, 'Se modifico correctamente el material.', [
            { tipo: 'material', datos: matModificado },
        ]);
    }).catch(err => {
        console.log(colores.danger('ERROR') + err);
        return RESP._500(res, {
            msj: 'Hubo un error actualizando el material.',
            err: err,
        });
    });

});

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;