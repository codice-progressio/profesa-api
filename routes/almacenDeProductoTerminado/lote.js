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
        .then(modeloCompleto =>
        {
            
            if (!modeloCompleto) throw "No existe el modelo"
            let mc = asignacionDeLote(modeloCompleto, lote)
            
            // Cuando se crea un nuevo lote su existencia
            // debe ser igual a la cantidaad creada. 
            return mc.save();

        })
        .then(mcActualizado => {

            return RESP._200(res, `Se guardo el lote para el modelo ${mcActualizado.nombreCompleto}`, [
                { tipo: 'modeloCompleto', datos: mcActualizado.getCamposParaAlmacen() },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error al guardar el lote.',
                err: err,
            });
        });
});


function asignacionDeLote(mc, lote) {
  // Si hay lotes entonces comprobamos que el primero
  // corresponda a este mes

  // Buscamos el lote en base a la fecha.
  if (
    //   Si esta en 0 creamos un nuevo lote.
    mc.lotes.length == 0 ||
    // Si tiene un lote pero no es de este mes creamos un nuevo lote tambien.
    mc.lotes[0].createAt.getMonth() !== new Date().getMonth()
  ) {
    // Si no hay lotes entonces creamos uno nuevo
    lote.existencia = lote.cantidadEntrada
    lote.entradas = []
    lote.entradas.push({
      cantidad: lote.cantidadEntrada,
      observaciones: lote.observaciones
    })
    mc.lotes.push(lote)
    return mc
  }

  // Lote existente. Solo le sumamos a la cantidad entrada
  mc.lotes[0].existencia += lote.cantidadEntrada
  mc.lotes[0].cantidadEntrada += lote.cantidadEntrada
  mc.lotes[0].entradas.push({
    //  Como ya existe un lote solo registramos la entrada con su
    // respectiva fecha.
    cantidad: lote.cantidadEntrada,
    observaciones: lote.observaciones
  })

  return mc
}


/**
 * 
 * Eliminar un lote por su id. 
 * 
 */

app.delete('/:idModeloCompleto/:idLote', (req, res) => {

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
app.put("/:idModeloCompleto/:idLote", (req, res) => {
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