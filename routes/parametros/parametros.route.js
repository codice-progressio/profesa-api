const express = require("express")
const app = express()

const Parametros = require("../../models/defautls/parametros.model")
const EtiquetasRoute = require("../../routes/parametros/parametros.etiquetas.route")

const ListaDePrecioRoute = require("../../routes/parametros/parametros.listaDePrecios.route")

const SKUsRoute = require("../../routes/parametros/parametros.skus.route")
const ContactoRoute = require("../../routes/parametros/parametros.contacto.route")
// Generales

app.use("/etiquetas", EtiquetasRoute)
app.use("/lista-de-precios", ListaDePrecioRoute)
app.use("/skus", SKUsRoute)
app.use("/contactos", ContactoRoute)

/**
 * Este route guarda los paramentros para definir el trabajo del sistema.
 * En general hay que crear primero la propiedad correspondiente en el schema
 * segun se vayan requiriendo los parametros.
 */

/**
 *
 * Inicializamos los parametros creando un solo objeto. No debemos tener mas de un documento en la BD
 */
app.post("/", (req, res, next) => {
  Parametros.find()
    .exec()
    .then(parametros => {
      if (parametros.length > 0)
        return res.send({ mensaje: "Los parametros ya existen" })
      var nPar = new Parametros()
      return nPar.save()
    })
    .then(parSaved => {
      return res.json(parSaved)
    })
    .catch(err => next(err))
})

app.delete("/", (req, res, next) => {
  Parametros.deleteOne({})
    .exec()
    .then(datos => {
      return res.json(datos)
    })
    .catch(_ => next(_))
})

//Despues de esto tiene que existir el docuemnto de parametros
// para poder continuar
app.use(async (req, res, next) => {
  var parametro = await Parametros.findOne().exec()
  if (!parametro)
    return next("No existe un documento para poder establecer este parametro")

  req["parametros"] = parametro
  next()
})

module.exports = app
