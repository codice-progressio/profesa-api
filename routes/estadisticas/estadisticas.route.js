const app = require("express")()
const Sku = require("../../models/sku.model")
const Contacto = require("../../models/contacto/contacto.model")
const $ = require("@codice-progressio/easy-permissions").$


app.get("/total-skus", 
$("estadisticas:total-skus", "Muestra el total de elementos en el dashboard"), (req, res, next) => {
  Sku.countDocuments()
    .exec()
    .then(total => res.send({ total }))
    .catch(_ => next(_))
})

app.get("/total-costo-existencias", 
  $("estadisticas:total-costo-existencias", "Muestra el costo total de las existencias"),
  (req, res, next) => {
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


app.get("/total-contactos", 
  $("estadisticas:total-contactos", "Muestra el total de los contactos"),
  (req, res, next) => {

  Contacto.countDocuments()
  .exec()
  .then(total => res.send({ total }))
  .catch(_ => next(_))

})

module.exports = app
