const app = require("express")()
const Sku = require("../../models/sku.model")

app.use("/sincronizar", (req, res, next) => {
  Sku.find({
    puedoVenderlo: true,
    eliminado: false,
  })
    .select(
      ["-produccion", "-existenciaAlmacenes", "-lotes", "-proveedores"].join(
        " "
      )
    )
    .then(skus => res.send({ skus }))
    .catch(_ => next(_))
})

module.exports = app
