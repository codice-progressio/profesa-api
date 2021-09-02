const app = require("express")()
const SKU = require("../../models/sku.model")
const ListDePrecios = require("../../models/listaDePrecios.model")

app.post("/", (req, res, next) => {
  // 1.- Remplazar todos los productos

  function transformarValores(sku) {
    let boleanos = ["puedoProducirlo", "puedoComprarlo", "puedoVenderlo"]

    let llaves = Object.keys(sku)
    boleanos.forEach(x => {
      if (llaves.includes(x)) {
        sku[x] = sku[x] === "1"
      }
    })
    return sku
  }

  function sku(datos) {
    // Debemos buscar si el codigo existe, si no existe el codigo,
    // entoces debemos crear un nuevo elemento.
    let filter = {
      codigo: datos.codigo,
    }
    //   XP espero que funcione. Remplazamos/creamos los campos que existan.
    let update = transformarValores(datos)

    update["lotes"] = []
    update.lotes.push({
      existencia: 0,
      observaciones: "[ SISTEMA ] Lote creado sin existencia",
      movimientos: [
        {
          cantidad: 0,
          esEntrada: true,
          observaciones: "[ SISTEMA ] Movimiento creado sin existencias",
          usuario: req.user._id,
        },
      ],
    })

    let options = {
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }

    let promesa = SKU.updateOne(filter, update, options)
    return new Promise((resolve, reject) => {
      promesa
        .exec()
        .then(respuesta => resolve())
        .catch(error => {
          reject({ error: error.toString(), datos })
        })
    })
  }

  if (!req.body) throw "No se recibieron datos"
  let datos = req.body
  if (!Array.isArray(datos)) throw "No es un arreglo de datos"

  // Debemos de recibir un arreglo
  const PROMESAS = req.body.map(d => sku(d))

  let skus_rechazados = []

  Promise.allSettled(PROMESAS)
    .then(r => {
      rechazados =
        r.filter(x => x.status === "rejected").map(x => x.reason) ?? []
      correctos = r.filter(x => x.status === "fulfilled")?.length ?? 0

      // 2.- Separar listas de precio

      res.send({ rechazados, correctos })
    })
    .catch(_ => next(_))

  // 3.- Guardar listas de precios con productos relacionados
})

/**
 * Tranforma los valores (boleanos) para que sen aceptados por la BD
 */

module.exports = app
