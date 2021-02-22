//Esto es necesario
const app = require("express")()
const Proveedor = require("../../models/proveedores/proveedor.model")
const $ = require("@codice-progressio/easy-permissions").$
const sku = require("../../models/sku.model")
const Parametros = require("../../models/defautls/parametros.model")

app.post("/", $("proveedor:crear"), (req, res, next) => {
  console.log(req.body)
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

  //No listamos los proveedores eliminados
  Proveedor.find({ eliminado: false })
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(proveedores => res.send(proveedores))
    .catch(err => next(err))
})

app.get("/buscar/id/:id", $("proveedor:leer:id"), (req, res) => {
  // Los eliminados no deben aparecer.
  Proveedor.findOne({ _id: req.params.id, eliminado: false })
    .exec()
    .then(proveedor => {
      if (!proveedor) throw "No existe el id o ha sido eliminado"
      return res.send(proveedor)
    })
    .catch(err => next(err))
})

app.get(
  "/buscar/termino/:termino",
  $("proveedor:leer:termino"),
  async (req, res) => {
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
      // No listmos los eliminados
      eliminado: false,
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
  }
)

app.put("/", $("proveedor:modificar"), (req, res, next) => {
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
        "esCliente",
        "esProveedor",
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
    .select("+eliminado")
    .exec()
    .then(proveedor => {
      if (!proveedor) throw "No existe el proveedor"
      // Solo cambiamos la bandera.
      proveedor.eliminado = true
      return proveedor.save()
    })
    .then(proveedor => res.send(proveedor))
    .catch(err => next(err))
})

// <!--
// =====================================
//  Buscador todos los elementos relacionados con el proveedor
// =====================================
// -->

app.get("/relacionados/:id", (req, res) => {
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

app.put("/agregar-etiqueta", async (req, res, next) => {
  try {
    const proveedor = await Proveedor.findById(req.body._id)
      .select("etiquetas")
      .exec()

    if (!proveedor) throw "No existe el id"
    await Parametros.crearEtiquetaSiNoExiste(req.body.etiqueta)

    proveedor.etiquetas.push(req.body.etiqueta)
    const proSave = await proveedor.save()

    return res.send(proSave)
  } catch (error) {
    next(error)
  }
})

module.exports = app
