//Esto es necesario
const app = require("express")()
const Contacto = require("../../models/contacto/contacto.model")
const $ = require("@codice-progressio/easy-permissions").$
const sku = require("../../models/sku.model")
const Parametros = require("../../models/defautls/parametros.model")
const ContactoOfflineRoute = require("./contacto.offline.route")


app.use("/offline", ContactoOfflineRoute)


app.post("/", $("contacto:crear"), (req, res, next) => {
  return new Contacto(req.body)
    .save()
    .then(contacto => res.send(contacto))
    .catch(err => next(err))
})

function agregarPaginacion(model, query) {
  const desde = Number(query.desde ?? 0)
  const limite = Number(query.limite ?? 30)
  const sort = Number(query.sort ?? 1)
  const campo = String(query.campo ?? "nombre")

  return model
    .select(
      "etiquetas nombre razonSocial contactos esCliente esProveedor rutas "
    )
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
}

app.get("/", $("contacto:leer:todo"), async (req, res, next) => {
  //No listamos los proveedores eliminados
  agregarPaginacion(Contacto.find({ eliminado: false }), req.query)
    .exec()
    .then(proveedores => res.send(proveedores))
    .catch(err => next(err))
})

app.get("/buscar/id/:id", $("contacto:leer:id"), (req, res, next) => {
  // Los eliminados no deben aparecer.


  Contacto.findOne({ _id: req.params.id, eliminado: false })
    .populate("rutas", undefined, "rutaDeEntrega")
    .populate("usuariosAsignados", 'nombre', 'Usuario')
    .exec()
    .then(contacto => {
      console.log(contacto)
      if (!contacto) throw "No existe el id o ha sido eliminado"
      return res.send(contacto)
    })
    .catch(err => next(err))
})

app.get(
  "/buscar/termino/:termino",
  $("contacto:leer:termino"),
  async (req, res, next) => {
    const desde = Number(req.query.desde ?? 0)
    const limite = Number(req.query.limite ?? 30)
    const sort = Number(req.query.sort ?? 1)
    const campo = String(req.query.campo ?? "nombre")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" },
    })

    const $match = {
      // No listmos los eliminados
      eliminado: false,
      $or: [],
    }

    ;["nombre", "rfc", "razonSocial"].forEach(x => $match.$or.push(b(x)))

    Contacto.aggregate([
      { $match },

      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
    ])
      .exec()
      .then(proveedores => res.send(proveedores))
      .catch(err => next(err))
  }
)

app.put("/", $("contacto:modificar"), (req, res, next) => {
  Contacto.findById(req.body._id)
    .exec()
    .then(contacto => {
      if (!contacto) {
        throw "No existe el contacto"
      }

      [
        "nombre",
        "razonSocial",
        "domicilios",
        "contactos",
        "rfc",
        "cuentas",
        "esCliente",
        "esProveedor",
        "listaDePrecios",
        "usuariosAsignados"
      ].forEach(x => {
        contacto[x] = req.body[x]
      })

      return contacto.save()
    })
    .then(contacto => res.send(contacto))
    .catch(err => next(err))
})

app.delete("/:id", $("contacto:eliminar"), (req, res, next) => {
  Contacto.findById(req.params.id)
    .select("+eliminado")
    .exec()
    .then(contacto => {
      if (!contacto) throw "No existe el contacto"
      // Solo cambiamos la bandera.
      contacto.eliminado = true
      return contacto.save()
    })
    .then(contacto => res.send(contacto))
    .catch(err => next(err))
})

// <!--
// =====================================
//  Buscador todos los elementos relacionados con el contacto
// =====================================
// -->

app.get("/relacionados/:id", (req, res, next) => {
  const desde = Number(req.query.desde ?? 0)
  const limite = Number(req.query.limite ?? 30)
  const sort = Number(req.query.sort ?? 1)
  const campo = String(req.query.campo ?? "nombre")

  sku
    .find({ "proveedores.idProveedor": req.params.id })
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(articulos => res.send(articulos))
    .catch(_ => next(_))
})

// <!--
// =====================================
//  END Buscador todos los elementos relacionados con el contacto
// =====================================
// -->

app.put("/etiquetas/agregar", async (req, res, next) => {
  try {
    const contacto = await Contacto.findById(req.body._id)
      .select("etiquetas")
      .exec()

    if (!contacto) throw "No existe el id"
    await Parametros.crearEtiquetaSiNoExiste(req.body.etiqueta)

    contacto.etiquetas.push(req.body.etiqueta)
    const proSave = await contacto.save()

    return res.send(proSave.etiquetas)
  } catch (error) {
    next(error)
  }
})

app.put("/etiquetas/eliminar", async (req, res, next) => {
  Contacto.findByIdAndUpdate(
    { _id: req.body._id },
    { $pull: { etiquetas: req.body.etiqueta } }
  )
    .exec()
    .then(() => res.send())
    .catch(_ => next(_))
})

app.get("/etiquetas/buscar/etiquetas", (req, res, next) => {
  const arreglo = [...req.query?.etiquetas?.split(",")] ?? []
  agregarPaginacion(Contacto.find({ etiquetas: { $all: arreglo } }), req.query)
    .exec()
    .then(contactos => {
      res.send(contactos)
    })
    .catch(_ => {
      next(_)
    })
})

app.put(
  "/rutas/agregar",
  $("contacto:rutas:agregar", "Agregar rutas a un contacto"),
  (req, res, next) => {
    Contacto.findById(req.body._id)
      .exec()
      .then(p => {
        if (!p) throw "No existe el id"

        while (p.rutas.length > 0) p.rutas.pop()
        p.rutas.push(...req.body.rutas)
        return p.save()
      })
      .then(p => res.send(p))
      .catch(_ => next(_))
  }
)

module.exports = app
