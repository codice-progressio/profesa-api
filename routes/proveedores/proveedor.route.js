//Esto es necesario
const app = require("express")()
const Proveedor = require("../../models/proveedores/proveedor.model")
const $ = require("../../config/permisos.config").$
const sku = require("../../models/sku.model")

app.post("/", $("proveedor:crear"), (req, res) => {
  return new Proveedor(req.body)
    .save()
    .then(proveedor => res.send(proveedor))
    .catch(err => next(err))
})

app.get("/", $("proveedor:leer:todo"), async (req, res) => {
  const desde = Number(req.query.desde ?? 0)
  const limite = Number(req.query.limite ?? 30)
  const sort = Number(req.query.sort ?? 1)
  const campo = String(req.query.campo ?? "nombre")

  Proveedor.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(proveedores => res.send(proveedores))
    .catch(err => next(err))
})

app.get("/:id", $("proveedor:leer:id"), (req, res) => {
  Proveedor.findById(req.params.id)
    .exec()
    .then(proveedor => {
      if (!proveedor) throw "No existe el id"
      return res.send(proveedor)
    })
    .catch(err => next(err))
})

app.get("/buscar/:termino", $("proveedor:leer:termino"), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")
  const termino = String(
    req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  )
  const b = campo => ({
    [campo]: { $regex: termino, $options: "i" },
  })

  const $match = {
    $or: [],
  }

  ;["nombre", "rfc", "razonSocial"].forEach(x => $match.$or.push(b(x)))

  Proveedor.aggregate([
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
})

app.put("/", $("proveedor:modificar"), (req, res) => {
  Proveedor.findById(req.body._id)
    .exec()
    .then(proveedor => {
      if (!proveedor) {
        throw "No existe el proveedor"
      }

      ;[
        "nombre",
        "razonSocial",
        "domicilios",
        "contactos",
        "rfc",
        "cuentas",
      ].forEach(x => {
        proveedor[x] = req.body[x]
      })

      return proveedor.save()
    })
    .then(proveedor => res.send(proveedor))
    .catch(err => next(err))
})

app.delete("/:id", $("proveedor:eliminar"), (req, res) => {
  Proveedor.findById(req.params.id)
    .exec()
    .then(proveedor => {
      if (!proveedor) throw "No existe el proveedor"

      return proveedor.remove()
    })
    .then(proveedor => res.send(proveedor))
    .catch(err => next(err))
})

// <!--
// =====================================
//  Buscador todos los elementos relacionados con el proveedor
// =====================================
// -->

app.get("/relacionadosAlArticulo/:id", (req, res) => {
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
//  END Buscador todos los elementos relacionados con el proveedor
// =====================================
// -->

module.exports = app
