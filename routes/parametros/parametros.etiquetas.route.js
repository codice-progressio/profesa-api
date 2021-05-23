const app = require("express")()
const Parametros = require("../../models/defautls/parametros.model")

app.get("/", (req, res) => {
  Parametros.findOne()
    .select("etiquetas")
    .exec()
    .then(p => res.send(p.etiquetas))
    .catch(_ => next(_))
})

app.put("/eliminar", (req, res, next) => {
  Parametros.findOneAndUpdate({}, { $pull: { etquetas: req.body.etiqueta } })
    .exec()
    .then(r => res.send())
    .catch(_ => next(_))
})

module.exports = app
