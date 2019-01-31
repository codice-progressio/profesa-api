let express = require('express');
let app = express();
let RESP = require('../../utils/respStatus');
let colores = require('../../utils/colors');
var CONSTANSTES = require('../../utils/constantes');

var ModeloCompleto = require('../../models/modeloCompleto');
var CRUD = require('../CRUD');

CRUD.app = app;
CRUD.modelo = ModeloCompleto;
CRUD.nombreDeObjetoSingular = 'modeloCompleto';
CRUD.nombreDeObjetoPlural = 'modelosCompletos';
CRUD.campoSortDefault = 'nombreCompleto';
CRUD.camposDeBusqueda = [
    'nombreCompleto',
];
CRUD.excluir = [
    'medias',
    'modelo',
    'tamano',
    'color',
    'terminado',
    'laserAlmacen',
    'versionModelo',
    'familiaDeProcesos',
    'procesosEspeciales',
    'porcentajeDeMerma',
    'espesor',
    'actualizarLotesYExistencias'
];

CRUD.crud(
    'get',
    'getBuscar'
);

/**
 * Guardar nuevo lote. 
 * 
 */
app.post('/lote', (req, res) => {

    let idModeloCompleto = req.body._id;
    let lote = req.body.lote;

    if (!idModeloCompleto) throw new Error('No definiste el modelo para actualizar el lote.');

    ModeloCompleto
        .findOne({ _id: idModeloCompleto })
        .exec()
        .then(modeloCompleto => {

            modeloCompleto.lotes.push(lote);
            return modeloCompleto.save();

        })
        .then(mcActualizado => {

            return RESP._200(res, `Se guardo el lote para el modelo ${mcActualizado.nombreCompleto}`, [
                { tipo: 'modeloCompleto', datos: mcActualizado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error al guardar el lote.',
                err: err,
            });
        });
});


/**
 * Guarda una nueva salida en en el lote 
 * que se le especifique. 
 */
app.post('/salida', (req, res) => {
    /**
     * El id del modelo completo del cual se va a guardar sus datos. 
     */
    let idModeloCompleto = req.body._id;
    /**
     * El id del lote. Este es un id de un subdocumento guardado
     * en el modelo ModeloCompleto.
     */
    let idLote = req.body._idLote;
    /**
     * El objeto salida que contiene la informacion
     * que vamos a guardar.
     */
    let salida = req.body.salida;

    // Buscamos el modeloCompleto 
    ModeloCompleto.findOne({ _id: idModeloCompleto })
        .exec()
        .then(mc => {
            if (!mc) {
                return RESP._400(res, {
                    msj: 'No existe el modelo.',
                    err: 'El id del modelo completo que ingresaste no existe.',
                });
            }
            // Guardamos el id
            let lote = mc.lotes.id(idLote);
            if (!lote) throw new Error('No existe el id del lote.');

            lote.addSalida(salida);
            return mc.save();
        })
        .then(mcModificado => {
            return RESP._200(res, 'Se registro la salida.', [
                { tipo: 'modeloCompleto', datos: mcModificado },
            ]);
        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error al agregar la salida al lote.',
                err: err,
            });
        });
});

app.post('/devolucion', (req, res) => {
    /*
     * El id del modelo completo del cual se va a guardar sus datos. 
     */
    let idModeloCompleto = req.body._id;
    /**
     * El id del lote. Este es un id de un subdocumento guardado
     * en el modelo ModeloCompleto.
     */
    let idLote = req.body._idLote;
    /**
     * El objeto devolucion que contiene la informacion
     * que vamos a guardar.
     */
    let devolucion = req.body.devolucion;

    ModeloCompleto.findOne({ _id: idModeloCompleto })
        .exec()
        .then(mc => {
            if (!mc) {
                return RESP._400(res, {
                    msj: 'No existe el modelo.',
                    err: 'El id del modelo completo que ingresaste no existe.',
                });
            }
            let lote = mc.lotes.id(idLote);
            if (!lote) throw new Error('No existe el id del lote.');
            mc.lotes.id(idLote).addDevolucion(devolucion);
            return mc.save();

        })
        .then(mcModificado => {
            return RESP._200(res, 'Se registro la devolucion de manera correcta.', [
                { tipo: 'modeloCompleto', datos: mcModificado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error al agregar la devolucion al lote.',
                err: err,
            });
        });

});

module.exports = app;