let express = require('express');
let app = express();
let RESP = require('../../utils/respStatus');
var ModeloCompleto = require('../../models/modeloCompleto');
var guard =  require('express-jwt-permissions')()
var permisos = require('../../config/permisos.config')

/**
 * Guardar nuevo lote. 
 * 
 */
app.post(
  "/",
  guard.check(permisos.$("almacenDeProductoTerminado:lote:crear")),
  (req, res) => {
    let idModeloCompleto = req.body._id
    let lote = req.body.lote

    if (!idModeloCompleto)
      throw "No definiste el modelo para actualizar el lote."

    ModeloCompleto.guardarLote(idModeloCompleto, lote)
      .then(mcActualizado => {
        return RESP._200(
          res,
          `Se guardo el lote para el modelo ${mcActualizado.nombreCompleto}`,
          [
            {
              tipo: "modeloCompleto",
              datos: mcActualizado.getCamposParaAlmacen(),
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




/**
 * 
 * Eliminar un lote por su id. 
 * 
 */

app.delete('/:idModeloCompleto/:idLote', guard.check(permisos.$('almacenDeProductoTerminado:lote:eliminar')),(req, res) => {

    let idModeloCompleto = req.params.idModeloCompleto;
    let idLote = req.params.idLote;

    ModeloCompleto.findOne({ _id: idModeloCompleto })
        .exec()
        .then(mc => {

            if (!mc) throw new Error('No existe el id del modelo que ingresaste.');
            if (!mc.lotes.id(idLote)) throw new Error('No existe el id del lote que ingresaste.');

            mc.lotes.pull({ _id: idLote });

            return mc.save();
        })
        .then(mcActualizado => {
            return RESP._200(res, 'Se elimino el lote de manera correcta.', [
                { tipo: 'modeloCompleto', datos: mcActualizado.getCamposParaAlmacen() },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error al eliminar el lote.',
                err: err,
            });
        });

});


/**
 * Modifca un lote en base a lid del modelo completo y del
 * propio lote. 
 * 
 * El middleware del modelo completo deberia de hacer el 
 * ajuste de la existencia de manera automatica.
 */
app.put("/:idModeloCompleto/:idLote", guard.check(permisos.$('almacenDeProductoTerminado:lote:modificar')), (req, res) => {
  /**
   * El id del modelo completo.
   */
  let idModeloCompleto = req.params.idModeloCompleto
  /**
   * El id del lote que debe existir en el mc.
   *
   */
  let idLote = req.params.idLote
  /**
   * Los datos del lote para modificar.
   */
  let lote = req.body
  // Buscamos el modelo.
  ModeloCompleto.findOne({ _id: idModeloCompleto })
    .exec()
    .then((mc) => {
      if (!mc) throw "No existe el id del modelo que ingresaste."
      if (!mc.lotes.id(idLote)) throw "No existe el id del lote que ingresaste"

      // Modificamos solo los datos que nos interesan.

      mc.lotes.id(idLote).existencia = lote.existencia
      mc.lotes.id(idLote).cantidadEntrada = lote.cantidadEntrada
      mc.lotes.id(idLote).observaciones = lote.observaciones

      mc.save()
    })
    .then((mcMod) => {
      return RESP._200(res, "Se modifico el lote de manera correcta", [
        { tipo: "modeloCompleto", datos: mcMod }
      ])
    })
    .catch((err) => {
      return RESP._500(res, {
        msj: "Hubo un error actualizando el lote.",
        err: err
      })
    })
})




module.exports = app;