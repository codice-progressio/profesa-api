const app = require("express")()
const Sku = require("../../models/sku.model")

app.get("/total-skus", (req, res, next) => {
  Sku.countDocuments()
    .exec()
    .then(total => res.send({ total }))
    .catch(_ => next(_))
})

app.get("/total-costo-existencias", (req, res, next) => {
  Sku.find()
    .select("existencia costoVenta ")
    .exec()
    .then(skus => {
      const total = skus.reduce((acumulado, sku) => {
        // La existencia debe ser >= 0 para que se calcule, si no, no
        // se toma en cuenta.
        let existencia = sku.existencia >= 0 ? sku.existencia ?? 0 : 0
        const multiplicacion = existencia * (sku.costoVenta ?? 0)
        return multiplicacion + acumulado
      }, 0)

      res.send({ total })
    })
    .catch(_ => next(_))
})

module.exports = app
