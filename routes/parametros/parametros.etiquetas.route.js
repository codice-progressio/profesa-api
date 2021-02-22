const app = require("express")()
const Parametros = require("../../models/defautls/parametros.model")

app.get("/", (req, res) => {
  Parametros.findOne()
    .select("etiquetas")
    .exec()
    .then(p => res.send(p.etiquetas))
    .catch(_ => next(_))
})

module.exports = app
