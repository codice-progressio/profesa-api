const app = require("express")()
const $ = require("@codice-progressio/easy-permissions").$
const Pedido = require("../../models/pedidos/pedido.model")

function popular(doc) {
  return doc
    .populate("contacto", "nombre")
    .populate(
      "articulos.sku",
      "nombreCompleto descripcion existenciaActual costoVenta"
    )
}
app.get(
  "/leer/todo",
  $(
    "pedido:leer:todo",
    "Leer todos los pedidos existentes con los respectivos filtros"
  ),
  (req, res, next) => {
    popular(Pedido.find())
      .sort({ createdAt: -1 })
      .limit(10)
      .exec()
      .then(r => res.send(r))
      .catch(_ => next(_))
  }
)

app.get(
  "/buscar/id/:id",
  $("pedido:buscar:id", "Buscar un pedido por su id"),
  (req, res, next) => {
    popular(Pedido.findById(req.params.id))
      .select("+acciones")
      .exec()
      .then(p => {
        if (!p) throw "No existe el id"
        return res.send(p)
      })
      .catch(_ => next(_))
  }
)

app.get(
  "/buscar/contacto/:idContacto",
  $("pedido:buscar:contacto", "Buscar todos los pedidos por contacto"),
  (req, res, next) => {
    Popular(Pedido.find({ eliminado: false, conctacto: req.params.idContacto }))
      .sort({ createdAt: -1 })
      .limit(10)
      .exec()
      .then(p => res.send(p))
      .catch(_ => next(_))
  }
)

app.get(
  "/buscar/usuario/",
  $("pedido:buscar:usuario", "Busca todos los pedidos por usuario"),
  (req, res, next) => {
    popular(Pedido.find({ eliminado: false, usuario: req.user._id }))
      .sort({ createdAt: -1 })
      .limit(10)
      .exec()
      .then(p => res.send(p))
      .catch(_ => next(_))
  }
)

app.post("/", $("pedido:crear", "Crear un pedido"), (req, res, next) => {
  const pedido = new Pedido(req.body)
  pedido.usuario = req.user._id
  const accion = {
    accion: "Se creo el pedido",
    usuario: req.user._id,
    estadoDocumento: null,
  }
  pedido.acciones.push(accion)
  pedido
    .save()
    .then(r => {
      res.send(r)
    })
    .catch(_ => next(_))
})

app.put("/", $("pedido:modificar", "Modifcar un pedido"), (req, res, next) => {
  Pedido.findById(req.body._id)
    .select("+acciones")
    .exec()
    .then(p => {
      if (!p) throw "No exisete el id"

      const accion = {
        accion: "Se modifico el pedido",
        usuario: req.user._id,
        estadoDocumento: copiarDatosParaHistorial(p),
      }
      p.acciones.push(accion)
      p.markModified("acciones")

      delete req.body._id
      Object.assign(p, req.body)
      return p.save()
    })
    .then(p => res.send(p))
    .catch(_ => next(_))
})

app.delete(
  "/:id",
  $("pedido:eliminar", "Permite liminar un pedido"),
  (req, res, next) => {
    Pedido.findById(req.params.id)
      .select("+acciones")
      .exec()
      .then(p => {
        if (!p) throw "No exisete el id"

        const accion = {
          accion: "Se eliminó el pedido",
          usuario: req.user._id,
          estadoDocumento: copiarDatosParaHistorial(p),
        }
        p.acciones.push(accion)
        p.markModified("acciones")
        p.eliminado = true
        return p.save()
      })
      .then(p => res.send(p))
      .catch(_ => next(_))
  }
)

function copiarDatosParaHistorial(pedido) {
  const campos = [
    "eliminado",
    "contacto",
    "usuario",
    "articulos",
    "observaciones",
  ]

  const obj = {}
  campos.forEach(x => (obj[x] = pedido[x]))
  return obj
}

module.exports = app
