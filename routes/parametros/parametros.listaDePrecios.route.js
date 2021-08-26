const app = require("express")()
const Parametros = require("../../models/defautls/parametros.model")

const ListaDePrecios = require("../../models/listaDePrecios.model")

app.get("/ligth", (req, res, next) => {
  ListaDePrecios.find()
    .select("nombre descripcion")
    .exec()
    .then(listasDePrecios => res.send({ listasDePrecios }))
    .catch(_ => next(_))
})

app.get("/", (req, res) => {
  Parametros.findOne()
    // .select("listaDePreciosDefault")
    .exec()
    .then(parametros => res.send({ parametros }))
    .catch(_ => next(_))
})

app.post("/", (req, res, next) => {
  Parametros.findOne()
    .select("listaDePreciosDefault")
    .exec()
    .then(parametros => {
      if (!req.body._id) throw "Debes definir una lista"
      parametros.listaDePreciosDefault = req.body._id
      return parametros.save()
    })
    .then(parametros => res.send({ parametros }))
    .catch(_ => next(_))
})
module.exports = app
