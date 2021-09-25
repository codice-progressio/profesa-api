const app = require("express")()
const Parametros = require("../../models/defautls/parametros.model")

const ListaDePrecios = require("../../models/listaDePrecios.model")
const SKU = require("../../models/sku.model")

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

// Lista de precios por default.
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

app.post("/lote", async (req, res, next) => {
  if (!req.body.nombre.trim()) throw "No se recibio el nombre de la lista"

  let CODIGOS = req.body.datos.map(x => x.codigo)
  let IDS = await SKU.find({ codigo: { $in: CODIGOS } }).select(" _id codigo")

  let rechazados = []

  let datosAcomodados = req.body.datos
    .filter(dato => {
      if (isNaN(dato?.precio)) {
        rechazados.push({ dato, error: `${dato.precio} no es un numero` })
        return false
      }

      return true
    })
    .map(dato => {
      let id = IDS.find(sku => sku.codigo === dato.codigo)?._id
      if (id) {
        dato["sku"] = id
      } else {
        rechazados.push({ dato, error: "Al parecer no existe el codigo" })
      }
      return dato
    })
  let filter = { nombre: req.body.nombre }
  let update = {
    nombre: req.body.nombre,
    skus: datosAcomodados,
    descripcion: "Lista generada en lote",
  }
  let options = {
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  }

  ListaDePrecios.updateOne(filter, update, options)
    .then(respuesta => {
      res.send({ respuesta, rechazados })
    })
    .catch(_ => next(_))
})
module.exports = app
