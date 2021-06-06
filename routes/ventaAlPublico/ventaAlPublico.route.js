const app = require("express")()
const sku = require("../../models/sku.model")
const Nota = require("../../models/ventaAlPublico/nota.model")

const $ = require("@codice-progressio/express-authentication").configuraciones
  .easy_permissions.$

app.post("/nota", $("venta-al-publico:crear:nota"), (req, res, next) => {
  let articulos = req.body
  // Buscamos todos los sku de la nota actual y ponemos el
  // precio al momento de la consulta para que haya una comparacion
  // si se cambio el precio.

  let skusIds = req.body.map(x => x.idSku)
  sku
    .find({ _id: { $in: [skusIds] } })
    .exec()
    .then(skus => {
      // Modificamos los articulos para agregar los datos
      // que necesitamos.
      articulos.map(a => {
        // Buscamos el sku
        let sku = skus.find(s => s._id.toString() === a.idSku)
        if (!sku) throw next(`El '${a.idSku}' no existe`)
        // Obtenemos el precio actual.
        a.precioActual = sku.costoVenta
        return a
      })

      // Modificados los articulos creamos la nota principal

      let nNota = new Nota()
      nNota.usuario = req.user._id
      let total = 0
      articulos.map(x => {
        nNota.articulos.push(x)
        total += x.precio
      })
      nNota.total = total
      return nNota.save()
    })
    .then(nota => res.send(nota))
    .catch(_ => next(_))
})

module.exports = app
