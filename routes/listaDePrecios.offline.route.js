const app = require("express")()
const ListaDePrecios = require("../models/listaDePrecios.model")

app.get("/sincronizar", (req, res, next) => {
  ListaDePrecios.find()
    .then(listasDePrecios => res.send({ listasDePrecios }))
    .catch(_ => next(_))
})

module.exports = app
