//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../utils/colors");
var RESP = require('../utils/respStatus');
var Gasto = require('../models/costos/gasto');

// ============================================
// Obtiene todos los gastos. 
// ============================================

app.get('/', (req, res) => {

    Gasto.find({}, (err, gastos) => {
        if (err) {
            return RESP._500(res, {
                msj: 'Hubo un error cargando los gastos.',
                err: err,
            });
        }

        if (gastos.length < 1) {
            return RESP._400(res, {
                msj: 'No hay gastos registrados.',
                err: 'Es necesario que registres por lo menos un nuevo gasto.',
            });
        }

        return RESP._200(res, null, [
            { tipo: 'gastos', datos: gastos },
        ]);

    });
});
// ============================================
// Guarda un nuevo gasto
// ============================================
app.post('/', (req, res) => {

    const gasto = new Gasto(req.body);
    gasto.save((err, gastoGuardado) => {
        if (err) {
            return RESP._500(res, {
                msj: 'Hubo un error guardando el nuevo gasto.',
                err: err,
            });
        }
        return RESP._200(res, `Se guardo correctamente el gasto ${gastoGuardado.nombre}`, [
            { tipo: 'gasto', datos: gastoGuardado },
        ]);
    });
});

// ============================================
// Mdofica un gasto
// ============================================
app.put('/', (req, res) => {
    const gasto = req.body;
    const set = {
        '$set': {
            nombre: gasto.nombre,
            consumoPorHora: gasto.consumoPorHora,
            costoPorHora: gasto.costoPorHora,
            gastoDirecto: gasto.gastoDirecto,
        }
    };
    Gasto.findByIdAndUpdate(gasto._id, set, (err, gastoAnterior) => {

        if (err) {
            return RESP._500(res, {
                msj: 'Hubo un error actualizando el gasto.',
                err: err
            });
        }

        if (err) {
            return RESP._400(res, {
                msj: 'No existe el gasto.',
                err: 'El id del gasto que ingresaste no existe.',
            });
        }

        return RESP._200(res, 'Se modifico correctamente el gasto.', [
            { tipo: 'gasto', datos: gastoAnterior },
        ]);

    });

});

// ============================================
// Elimina un gasto.
// ============================================
app.delete('/:id', (req, res) => {
    Gasto.findByIdAndDelete(req.params.id, (err, borrado) => {
        if (err) {
            return RESP._500(res, {
                msj: 'No se pudo borrar el gasto.',
                err: err,
            });
        }

        if (err) {
            return RESP._400(res, {
                msj: 'No existe el gasto.',
                err: 'El id del gasto que ingresaste no existe. ',
            });
        }
        return RESP._200(res, 'Se borro el gasto de manera correcta.', [
            { tipo: 'gasto', datos: borrado },
        ]);

    });

});

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;