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
      
      const total = skus.reduce((acumulado, sku) =>
      {
        const mul = (sku.existencia ?? 0) * (sku.costoVenta ?? 0)
        return mul + acumulado
      }, 0)

      
      res.send({ total })
    })
    .catch(_ => next(_))
})

module.exports = app
