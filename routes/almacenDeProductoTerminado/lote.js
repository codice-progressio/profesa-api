const express = require('express');
const app = express();
const RESP = require('../../utils/respStatus');
const SKU = require('../../models/sku.model');
const $ =  require('@codice-progressio/easy-permissions').$

/**
 * Guardar nuevo lote. 
 * 
 */
app.post(
  "/",
  $("almacenDeProductoTerminado:lote:crear"),
  (req, res) => {
    let idSKU = req.body._id
    let lote = req.body.lote

    if (!idSKU)
      throw "No definiste el modelo para actualizar el lote."

    SKU.guardarLote(idSKU, lote)
      .then(skuActualizado => {
        return RESP._200(
          res,
          `Se guardo el lote para el modelo ${skuActualizado.nombreCompleto}`,
          [
            {
              tipo: "sku",
              datos: skuActualizado.getCamposParaAlmacen(),
            },
          ]
        )
      })
      .catch(err => {
        return RESP._500(res, {
          msj: "Hubo un error al guardar el lote.",
          err: err,
        })
      })
  }
)









module.exports = app;