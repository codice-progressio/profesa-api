const app = require("express")()
const $ = require("@codice-progressio/easy-permissions").$
const ListaDePrecios = require("../models/listaDePrecios.model")
const ObjectId = require("mongoose").Types.ObjectId
const Cliente = require("../models/cliente")

app.post(
  "/",
  $("lista-de-precios:crear", "Crear una nueva lista de precios"),
  (req, res, next) => {
    let listaDePrecios = new ListaDePrecios(req.body)
    listaDePrecios
      .save()
      .then(listaDePrecios => res.send({ listaDePrecios }))
      .catch(_ => next(_))
  }
)

app.get(
  "/",
  $("lista-de-precios:leer:todo", "Leer las listas de precio existentes"),
  (req, res, next) => {
    ListaDePrecios.find({})
      // Sin productos para que pese menos xD
      .select("-skus")
      .exec()
      .then(listaDePrecios => res.send({ listaDePrecios }))
      .catch(_ => next(_))
  }
)

app.get(
  "/id/:id",
  $("lista-de-precios:leer:id", "Leer las listas de precio existentes"),
  (req, res, next) => {
    let noCargarSkus = req.query.noCargarSkus

    let aggregateSkus = [
      {
        $unwind: {
          path: "$skus",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          "skus.sku": { $toObjectId: "$skus.sku" },
        },
      },

      {
        $lookup: {
          from: "skus",
          localField: "skus.sku",
          foreignField: "_id",
          as: "skus.sku",
        },
      },
      {
        $unwind: {
          path: "$skus.sku",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $unset: [
          "skus.sku.lotes",
          "skus.sku.produccion",
          "skus.sku.proveedores",
        ],
      },

      {
        $group: {
          _id: {
            _id: "$_id",
            nombre: "$nombre",
            iva: "$iva",
            descripcion: "$descripcion",
            esDefault: "$esDefault",
          },
          skus: {
            $push: "$skus",
          },
        },
      },
      {
        $addFields: {
          _id: "$_id._id",
          nombre: "$_id.nombre",
          iva: "$_id.iva",
          descripcion: "$_id.descripcion",
          esDefault: "$_id.esDefault",
        },
      },
    ]
    let match = [
      {
        $match: {
          _id: ObjectId(req.params.id),
        },
      },
    ]

    if (!noCargarSkus) match.push(...aggregateSkus)
    else {
      match.push({
        $unset: ["skus"],
      })
    }
    ListaDePrecios.aggregate(match)
      .then(li => {
        let listaDePrecios = li[0]
        if (!listaDePrecios) throw "No existe el id"
        res.send({ listaDePrecios })
      })
      .catch(_ => next(_))
  }
)

app.get("/id/:id/tamano-de-lista", (req, res, next) => {
  ListaDePrecios.aggregate([
    { $match: { _id: ObjectId(req.params.id) } },
    {
      $project: {
        tamano: {
          $size: "$skus",
        },
      },
    },
  ])
    .exec()
    .then(tamano => res.send({ ...tamano[0] }))
    .catch(_ => next(_))
})
app.put("/", $("lista-de-precios:modificar:id"), (req, res, next) => {
  // Solo modificamos datos generales.

  console.log(req.body)
  let noCargarSkus = req.query.noCargarSkus

  ListaDePrecios.findById(req.body._id)
    .then(lista => {
      if (!lista) throw "No existe la lista"
      lista.nombre = req.body.nombre
      lista.iva = req.body.iva
      lista.descripcion = req.body.descripcion

      // Solo actualizamos los sku que se estan
      if (!noCargarSkus) {
        while (lista.skus.length > 0) lista.skus.pop()
        req.body.skus.forEach(s => lista.skus.push(s))
      }

      return lista.save()
    })
    .then(listaDePrecios => res.send({ listaDePrecios }))
    .catch(_ => next(_))
})

app.put(
  "/asignar-a-cliente",

  $("lista-de-precios:asignar-a-acliente"),

  (req, res, next) => {
    Cliente.findById(req.body.idCliente)
      .select("listaDePrecios")
      .then(cliente => {
        cliente.listaDePrecios = req.body._id
        return cliente.save()
      })

      .then(cliente => res.send({ cliente }))
      .catch(_ => next(_))
  }
)

app.delete("/:id", $("lista-de-precios:eliminar"), (req, res, next) => {
  // No puede ser la lista por defecto

  let idDefault = req.parametros.listaDePreciosDefault
  let id = req.params.id

  if (idDefault === id)
    throw "No puedes eliminar la lista por default. Debes cambiarla antes de poder continuar. "

  // Buscamos todos los clientes que tienen esta lista.

  Cliente.updateMany(
    {
      listaDePrecios: id,
    },
    {
      listaDePrecios: undefined,
    }
  )

    .then(ok => {
      // Eliminamos la lista
      return ListaDePrecios.findByIdAndDelete(id)
    })

    .then(listaDePrecios => res.send({ listaDePrecios }))
    .catch(_ => next(_))
})

module.exports = app
