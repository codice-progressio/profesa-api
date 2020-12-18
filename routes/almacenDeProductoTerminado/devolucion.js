let express = require('express');
let app = express();
let RESP = require('../../utils/respStatus');
var SKU = require('../../models/sku.model');

var permisos = require('../../config/permisos.config')

app.post('/', permisos.$('almacenDeProductoTerminado:devolucion'), (req, res) => {
    /*
     * El id del modelo completo del cual se va a guardar sus datos. 
     */
    let idSKU = req.body._id;
    /**
     * El id del lote. Este es un id de un subdocumento guardado
     * en el modelo sku.
     */
    let idLote = req.body._idLote;
    /**
     * El objeto devolucion que contiene la informacion
     * que vamos a guardar.
     */
    let devolucion = req.body.devolucion;

    SKU.findOne({ _id: idSKU })
        .exec()
        .then(sku => {
            if (!sku) {
                return RESP._400(res, {
                    msj: 'No existe el modelo.',
                    err: 'El id del modelo completo que ingresaste no existe.',
                });
            }
            let lote = sku.lotes.id(idLote);
            if (!lote) throw new Error('No existe el id del lote.');
            sku.lotes.id(idLote).addDevolucion(devolucion);
            return sku.save();

        })
        .then(skuModificado => {
            return RESP._200(res, 'Se registro la devolucion de manera correcta.', [
                { tipo: 'sku', datos: skuModificado.getCamposParaAlmacen() },
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