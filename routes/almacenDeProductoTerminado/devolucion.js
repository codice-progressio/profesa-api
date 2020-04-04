let express = require('express');
let app = express();
let RESP = require('../../utils/respStatus');
var ModeloCompleto = require('../../models/modeloCompleto');

var guard =  require('express-jwt-permissions')()
var permisos = require('../../config/permisos.config')

app.post('/', guard.check(permisos.$('almacenDeProductoTerminado:devolucion')), (req, res) => {
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
                { tipo: 'modeloCompleto', datos: mcModificado.getCamposParaAlmacen() },
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