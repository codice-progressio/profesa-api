const app = require("express")()
const RutasDeEntrega = require("../../models/rutasDeEntrega/rutaDeEntrega.model")
const ObjectId = require("mongoose").Types.ObjectId
const $ = require("@codice-progressio/easy-permissions").$

const Contacto = require("../../models/proveedores/proveedor.model")

// Me aurre una operación.
app.put(
  "/",

  $(
    "rutas-de-entrega:crear-modificar",
    "Crear o modificar una ruta de entrega"
  ),

  (req, res, next) => {
    // Si no viene un id, creamos el nuevo documento.
    req.body["_id"] = req.body?._id ?? ObjectId()

    const query = { _id: req.body._id }
    const update = req.body
    const options = {
      //   Si no existe el elemento crea uno nuevo.
      upsert: true,
      // Retorna el nuevo elemento creado
      new: true,
      // Define los valores por default del schema al crear un nuevo doc
      setDefaultsOnInsert: true,
      // Dispara los validadores siempre.
      runValidators: true,
    }

    // Find the document
    RutasDeEntrega.findOneAndUpdate(query, update, options)
      .exec()
      .then(r => res.send(r))
      .catch(_ => next(_))
  }
)

app.get(
  "/",

  $("rutas-de-entrega:leer:todo", "Leer todas las rutas existentes"),
  (req, res, next) => {
    RutasDeEntrega.find({})
      .exec()
      .then(r => res.send(r))
      .catch(_ => next(_))
  }
)

app.get(
  "/buscar/id/:id",

  $("rutas-de-entrega:buscar:id", "Buscar por id una ruta"),
  (req, res, next) => {
    RutasDeEntrega.findById(req.params.id)
      .exec()
      .then(r => {
        if (!r) throw "No existe el id"
        res.send(r)
      })
      .catch(_ => next(_))
  }
)

app.get(
  "/buscar/contactos-de-ruta/:id",

  $(
    "rutas-de-entrega:buscar:contactos-de-ruta",
    "Buscar todos los cantactos asignados a una ruta"
  ),
  (req, res, next) => {
    Contacto.find({ rutas: req.params.id })
      .select("nombre esCliente esProveedor rutas etiquetas")
      .exec()
      .then(c => res.send(c))
      .catch(_ => next(_))
  }
)

app.delete(
  "/eliminar/id/:id",

  $("rutas-de-entrega:eliminar:id", "Eliminar una ruta por su id"),

  (req, res, next) => {
    // Buscamos todos los contactos que tienen asignado esta ruta y los eliminamos

    Contacto.updateMany(
      { rutas: req.params.id },
      { $pull: { rutas: req.params.id } }
    )
      .exec()
      .then(respuesta => {
        return RutasDeEntrega.findByIdAndDelete(req.params.id).exec()
      })
      .then(respuesta => res.send(respuesta))
      .catch(_ => next(_))
  }
)

module.exports = app
