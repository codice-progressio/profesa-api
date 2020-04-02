var express = require("express")
var app = express()

var Parametros = require("../../models/defautls/parametrosDeTrabajo.model")

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
      if (parametros.length > 1) throw "Los parametros ya se han creado"
      var nPar = new Parametros()
      return nPar.save()
    })
    .then(parSaved => {
      return res.json(parSaved)
    })
    .catch(err => next(err))
})

app.use(async (req, res, next) => {
  var parametro = await Parametros.find().exec()

  if (!parametro[0])
    return next("No existe un documento para poder establecer este parametro")

  next()
})

// LO QUE SIGUE SON PERSONALIZABLES PARA CADA PROYECTO

app.put("/localizacionDeOrdenes", (req, res, next) => {
  Parametros.updateOne({}, { localizacionDeOrdenes: req.body })
    .exec()
    .then(nParSave => {
      return res.json(nParSave)
    })
    .catch(err => next(err))
})

module.exports = app
