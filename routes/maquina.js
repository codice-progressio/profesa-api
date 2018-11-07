//Esto es necesario
var express = require('express');
var app = express();
var colores = require("../utils/colors");
var Maquina = require("../models/maquina");

var RESP = require("../utils/respStatus");


// ============================================
// Obtiene todoas las máquinas.
// ============================================

app.get('/', (req, res, next) => {
    Maquina.find({})
        .populate('gastos.gasto')
        .populate('departamentos')
        .exec((err, maquinas) => {
            RESP._500(res, {
                msj: 'Hubo un error buscando las máquinas.',
                err: err,
            });

            RESP._200(res, null, [
                { tipo: 'maquinas', datos: maquinas },
            ]);
        });
});




// ============================================
// Guarda una máquina nueva. 
// ============================================

app.post('/', (req, res, next) => {
    Maquina.create(req.body).then((maquina) => {
        RESP._200(res, "Se creó la máquina correctamente.", [
            { tipo: 'maquina', datos: maquina },
        ]);
    }).catch((err) => {
        return RESP._500(res, {
            msj: 'No se pudo guardar la máquina.',
            err: err,
        });
    });
});

app.put('/', (req, res) => {


    Maquina.findById(req.body._id, (err, maquinaEncontrada) => {

        if (err) {
            return RESP._500(res, {
                msj: 'Hubo un error buscando la máquina. ',
                err: err,
            });
        }

        if (!maquinaEncontrada) {
            return RESP._400(res, {
                msj: 'No exíste la máquina.',
                err: 'No existe una máquina con ese id.',
            });
        }

        maquinaEncontrada.nombre = req.body.nombre;
        maquinaEncontrada.clave = req.body.clave;
        maquinaEncontrada.anio = req.body.anio;
        maquinaEncontrada.nombresAnteriores = req.body.nombresAnteriores;
        maquinaEncontrada.ordenes = req.body.ordenes;
        maquinaEncontrada.departamentos = req.body.departamentos;
        maquinaEncontrada.datosDeTrabajo = req.body.datosDeTrabajo;
        maquinaEncontrada.numeroDeSerie = req.body.numeroDeSerie;
        maquinaEncontrada.gastos = req.body.gastos;
        maquinaEncontrada.costo = req.body.costo;
        maquinaEncontrada.depreciacion = req.body.depreciacion;
        maquinaEncontrada.observaciones = req.body.observaciones;

        maquinaEncontrada.save((err, maquinaAnterior) => {
            if (err) {
                return RESP._500(res, {
                    msj: 'No se pudo modificar la máquina. ',
                    err: err,
                });
            }


            return RESP._200(res, 'Se modifico la máquina de manera correcta.', [
                { tipo: 'maquina', datos: maquinaAnterior },
            ]);

        });
    });

});




// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;