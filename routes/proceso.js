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
// Obtiene todos los procesos. Especiales y en familia. 
// ============================================

app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Promise.all([
        obtenerProcesosEspeciales(),
        obtenerProcesosNormales(),
        obtenerFamiliasDeProcesos()
    ]).then(resp => {

        return RESP._200(res, null, [
            { tipo: 'procesosEspeciales', datos: resp[0] },
            { tipo: 'procesosNormales', datos: resp[1] },
            { tipo: 'familiaDeProcesos', datos: resp[2] },
        ]);

    }).catch(err => {

        return RESP._500(res, {
            msj: 'No se pudo realizar la operación. ',
            err: err
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
// ============================================
// Guardamos una nueva famila de procesos. 
// ============================================
app.post('/familia', (req, res) => {
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
app.put('/familia/:idFamilia', (req, res) => {
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
            { tipo: 'familiaActualizada', datos: familiaActualizada },
        ]);

    });
    console.log(' Parece que no entro  ');
});

// // ============================================
// // Guardamos un proceso especial para el modelo. 
// // ============================================
// app.post('/especial/:id', (req, res, next) => {
//     console.log(colores.info("/proceso") + "[post] Funcionando.");

// });

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


// ============================================
// Promesas
// ============================================


function obtenerProcesosEspeciales() {
    return new Promise((resolve, reject) => {
        //Buscamos todos los procesos especiales. 
        Proceso.find({ especial: true })
            .populate('departamento')
            .populate('gastos.gasto')
            .populate({
                path: 'maquinas',
                populate: { path: 'gastos.gasto' }
            })
            .exec((err, procesosEspeciales) => {
                if (err) {
                    reject('Error al buscar procesos especiales' + err);
                }
                resolve(procesosEspeciales);
            });
    });
}

function obtenerProcesosNormales() {
    return new Promise((resolve, reject) => {
        //Buscamos todos los procesos 
        Proceso.find({ especial: false })
            .populate('departamento')
            .populate('gastos.gasto')
            .populate({
                path: 'maquinas',
                populate: { path: 'gastos.gasto' }
            })
            .exec((err, procesos) => {
                if (err) {
                    reject('Error al buscar procesos normales' + err);
                }
                resolve(procesos);
            });
    });
}

function obtenerFamiliasDeProcesos() {
    return new Promise((resolve, reject) => {
        //Buscamos las familias de procesos. 
        FamiliaDeProceso.find({})
            // .populate('procesos.proceso')
            .populate('procesos.proceso')
            .populate({
                path: 'procesos.proceso',
                populate: { path: 'departamento costos maquinas' }
            })
            .exec((err, familiaDeProcesos) => {
                if (err) {
                    reject("Error cargando familias de proceso." + err);
                }
                resolve(familiaDeProcesos);
            });
    });
}



// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;