//Esto es necesario
var express = require('express');
var app = express();
var FamiliaDeProceso = require('../models/procesos/familiaDeProcesos');
var ModeloCompleto = require('../models/modeloCompleto');
var Proceso = require('../models/procesos/proceso');
var colores = require("../utils/colors");
var RESP = require('../utils/respStatus');
var Departamento = require('../models/departamento');
var CONSTANSTES = require('../utils/constantes');

// ============================================
// Obtiene todos los procesos. 
// ============================================

app.get('/', (req, res, next) => {
    var desde = Number(req.query.desde || 0);
    var limite = Number(req.query.limite || 5);

    Proceso.find()
        .limit(limite)
        .skip(desde)
        .exec()
        .then(resp => {
            docs = resp;
            return Proceso.countDocuments();
        }).then(conteo => {

            return RESP._200(res, null, [
                { tipo: 'procesos', datos: docs },
                { tipo: 'total', datos: conteo },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error cargando los procesos.',
                err: err,
            });
        });
});





// ============================================
// Guardamos un nuevo proceso
// ============================================

app.post('/', (req, res) => {
    let proceso = new Proceso(req.body);
    proceso.save((err, procesoGuardado) => {

        if (err) {
            console.log(JSON.stringify(proceso));

            return RESP._500(res, {
                msj: 'Hubo un error grabando el proceso.',
                err: err,
            });
        }

        return RESP._200(res, `Se guardo correctamente el proceso ${procesoGuardado.nombre}.`, [
            { tipo: 'proceso', datos: procesoGuardado },
        ]);

    });

});

// ============================================
// Modificamos un proceso existente. 
// ============================================

app.put('/:idProceso', (req, res) => {
    const proceso = req.body;
    const set = {
        '$set': {
            departamento: proceso.departamento,
            nombre: proceso.nombre,
            pasos: proceso.pasos,
            observaciones: proceso.observaciones,
            especial: proceso.especial,
            gastos: proceso.gastos,
            maquinas: proceso.maquinas,
        }
    };

    Proceso.findByIdAndUpdate(req.params.idProceso, set, (err, doc) => {
        if (err) {
            return RESP._500(res, {
                msj: 'Hubo un error actualizando el proceso.',
                err: err,
            });
        }

        if (!doc) {
            return RESP._400(res, {
                msj: 'El proceso no existe.',
                err: 'El id del proceso que pasaste no éxiste.',
            });
        }

        return RESP._200(res, 'Se actualizo el proceso de manera correcta.', [
            { tipo: 'proceso', datos: doc },
        ]);

    });

});

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;