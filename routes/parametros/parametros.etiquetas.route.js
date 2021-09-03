const app = require("express")()
const Parametros = require("../../models/defautls/parametros.model")
const $ = require("@codice-progressio/easy-permissions").$

app.get(
  "/",

  (req, res) => {
    Parametros.findOne()
      .select("etiquetas")
      .exec()
      .then(p => res.send(p.etiquetas))
      .catch(_ => next(_))
  }
)

app.put(
  "/eliminar",
  $(
    "configuraciones:etiquetas:eliminar",
    "Eliminar una etiqueta de la lista de autocompletado"
  ),
  (req, res, next) => {
    Parametros.findOneAndUpdate({}, { $pull: { etquetas: req.body.etiqueta } })
      .exec()
      .then(r => res.send())
      .catch(_ => next(_))
  }
)

module.exports = app
