let express = require('express');
let app = express();
let RESP = require('../../utils/respStatus');
var ModeloCompleto = require('../../models/modeloCompleto');


/**
 * Guardar nuevo lote. 
 * 
 */
app.post('/', (req, res) => {

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





module.exports = app;