let express = require("express")
let app = express()
let RESP = require("../../utils/respStatus")
let ModeloCompleto = require("../../models/modeloCompleto")

/**
 * Guarda una nueva salida en en el lote
 * que se le especifique.
 */
app.post("/", (req, res) => {
  /**
   * El id del modelo completo del cual se va a guardar sus datos.
   */
  let idModeloCompleto = req.body._id
  /**
   * El id del lote. Este es un id de un subdocumento guardado
   * en el modelo ModeloCompleto.
   */
  let idLote = req.body._idLote
  /**
   * El objeto salida que contiene la informacion
   * que vamos a guardar.
   */
  let salida = req.body.salida

  // Buscamos el modeloCompleto
  ModeloCompleto.findOne({ _id: idModeloCompleto })
    .exec()
    .then((mc) => {
      if (!mc)
        throw new Error("El id del modelo completo que ingresaste no existe.")

      // Guardamos el id
      let lote = mc.lotes.id(idLote)
      if (!lote) throw new Error("No existe el id del lote.")

      lote.addSalida(salida)
      return mc.save()
    })
    .then((mcModificado) => {
      return RESP._200(res, "Se registro la salida.", [
        { tipo: "modeloCompleto", datos: mcModificado.getCamposParaAlmacen() }
      ])
    })
    .catch((err) => {
      return RESP._500(res, {
        msj: "Hubo un error al agregar la salida al lote.",
        err: err
      })
    })
})

module.exports = app
