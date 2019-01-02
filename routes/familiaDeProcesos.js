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
// Obtiene todas las familias de proceso. 
// ============================================


app.get('/', (req, res, next) => {
    var desde = Number(req.query.desde || 0);
    var limite = Number(req.query.limite || 5);
    var docs;

    FamiliaDeProceso.find()
        .limit(limite)
        .skip(desde)
        .then(resp => {
            docs = resp;
            return FamiliaDeProceso.countDocuments();
        })
        .then(conteo => {
            return RESP._200(res, null, [
                { tipo: 'familiasDeProcesos', datos: docs },
                { tipo: 'total', datos: conteo },
            ]);
        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error buscando las familias de procesos.',
                err: err,
            });
        });

});

// ============================================
// Guardamos una nueva famila de procesos. 
// ============================================
app.post('/', (req, res) => {
    const familiaDeProcesos = new FamiliaDeProceso(req.body);

    // Comprobamos que el órden no este repetido. 
    let normal = [];
    familiaDeProcesos.procesos.forEach(f => {
        normal.push(f.orden);
    });

    if (normal.unique().length < normal.length) {
        return RESP._400(res, {
            msj: 'No puede ser repetido',
            err: 'No se debe repetir el número de órden.'
        });
    }

    // Guardamos por defecto CONTROL DE PRODUCCIÓN como el primer proceso que se debe realizar en la familia. y
    // como primer departamento por defecto. 
    // Lo buscamos
    const p = Proceso.findOne({ nombre: CONSTANSTES.PROCESOS.CONTROL_DE_PRODUCCION._n }).exec();
    p.then(procesoD => {
        if (!procesoD) {
            return RESP._500(res, {
                msj: 'Hubo un error buscando el proceso por defecto: ' + CONSTANSTES.PROCESOS.CONTROL_PRODUCCION._n,
                err: 'El sistema necesita este proceso para poder continuar. (¿Defaults no funcionan?)',
                masInfo: [{
                    infoAdicional: CONST.ERRORES.MAS_INFO.TIPO_ERROR.NO_DATA.infoAdicional,
                    dataAdicional: CONST.ERRORES.MAS_INFO.TIPO_ERROR.NO_DATA.dataAdicional
                }]
            });
        }
        familiaDeProcesos.procesos.unshift({ proceso: procesoD._id, orden: 0 });
        return familiaDeProcesos.save();
    }).then(familiaNueva => {
        return RESP._200(res, 'Se guardo la familia de manera correcta.', [
            { tipo: 'familiaDeProcesos', datos: familiaNueva },
        ]);
    }).catch(err => {
        return RESP._500(res, {
            msj: 'Hubo un error guardando la familia de procesos.',
            err: err,
        });
    });

});

// ============================================
// Modificamos una famiia
// ============================================
app.put('/:idFamilia', (req, res) => {
    const id = req.params.idFamilia;
    console.log(' Entro ');

    const set = {
        '$set': {
            procesos: req.body.procesos,
            nombre: req.body.nombre,
        }
    };

    FamiliaDeProceso.findByIdAndUpdate(id, set, (err, familiaActualizada) => {
        console.log(' Tuvo que haber guardado.  ');
        if (err) {
            return RESP._500(res, {
                msj: 'Hubo un error actualizando la familia',
                err: err,
            });
        }

        if (!familiaActualizada) {
            return RESP._400(res, {
                msj: 'No existe la familia.',
                err: "El id de la familia que pasaste no existe. ",

            });
        }

        return RESP._200(res, 'Se actualizo la familia de manera correcta.', [
            { tipo: 'familiaDeProcesos', datos: familiaActualizada },
        ]);

    });
    console.log(' Parece que no entro  ');
});

// ============================================
// Guardamos una familia existente a un modelo.
// ============================================

app.put('/:idModeloCompleto/:idFamilia', (req, res, next) => {

    //Obtenemos los id.
    var idFamilia = req.params.idFamilia;
    var idModeloCompleto = req.params.idModeloCompleto;

    //Comprobamos que el modelo exista.
    var busqueda = {
        '_id': idModeloCompleto
    };

    var set = {
        '$set': {
            familiaDeProcesos: idFamilia
        }
    };

    ModeloCompleto.findByIdAndUpdate(busqueda, set, (err, doc) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Hubo un error.",
                error: { message: err }
            });
        }
        if (!doc) {
            return res.status(400).json({
                ok: false,
                mensaje: "El modelo no existe.",
                doc: doc,
                error: { message: err }
            });
        }
        return res.status(200).json({
            ok: true,
        });

    });


});

module.exports = app;