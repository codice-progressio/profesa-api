const express = require("express")
const app = express()

const Parametros = require("../../models/defautls/parametros.model")
const EtiquetasRoute = require("../../routes/parametros/parametros.etiquetas.route")

const ListaDePrecioRoute = require("../../routes/parametros/parametros.listaDePrecios.route")

const SKUsRoute = require("../../routes/parametros/parametros.skus.route")
const ContactoRoute = require("../../routes/parametros/parametros.contacto.route")
// Generales
const UsuarioRoute = require("./parametros.usuario.route.js")

const $ = require('@codice-progressio/easy-permissions').$

app.use("/etiquetas", EtiquetasRoute)



app.get("/version-offline", (req, res, next) => {
  
  Parametros.findOne().select('version_offline').exec()
  .then(p=> res.send({ version_offline: p.version_offline }))
  .catch(_=>next(_))
})


app.post("/version-offline-reiniciar",
  $("parametros:version-offline-reiniciar", "Reinicia el versionado offline"), (req, res, next) => {
  
  Parametros.updateOne({}, {version_offline:0}).exec()
  .then(()=>res.send())
  .catch(_=>next(_))
})


//Crea una operación para guardar una nueva verisión y la almacena 
// en el objeto req. Esto se comparte con los contactos, skus, usuarios y listas 
// de precios. 
app.use((req, res ,next) => {
  
  req['version_offline'] = ()=> new Promise((resolve, reject) => {
    const parametros = require('../../models/defautls/parametros.model')
    
    parametros.findOne().select('version_offline')

    .exec()
      .then(parametro => {
        parametro.version_offline++ 
        return parametro.save()

    })
    .then(_ => resolve(_))
    .catch(_=>reject(_))
  })

  return next()
 })



app.use(
  "/lista-de-precios",
  $(
    "configuraciones:lista-de-precios:administrar",
    "Administrar las configuraciones generales de listas de precios como la carga por lotes y listas por default."
  ),
  ListaDePrecioRoute
)
app.use(
  "/skus",
  $(
    "configuraciones:skus:administrar",
    "Administrar las configuraciones generales de los skus como carga por lote",
  ),
  SKUsRoute
)
app.use(
  "/contactos",
  $(
    "configuraciones:contactos:administrar",
    "Administrar las configuraciones generales de contactos como carga por lotes"
  ),
  ContactoRoute
)

app.use(
  "/usuarios",
  $(
    "configuraciones:usuarios:administrar",
    "Administrar las configuraciones generales de usuarios como carga por lotes"
  ),
  UsuarioRoute
)

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
