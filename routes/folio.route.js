// Este es dl nuevo route para el folio.

//Esto es necesario
var express = require("express")
var app = express()
var Folio = require("../models/folios/folio")
var RESP = require("../utils/respStatus")

const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

var guard =  require('express-jwt-permissions')()
var permisos = require('../config/permisos.config')

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.delete("/:id", permisos.$("folio:eliminar"), (req, res) => {
  const id = req.params.id

  if (!id) {
    return RESP._400(res, {
      msj: "No definiste un id para eliminar.",
      err: "Es necesario que definas un id."
    })
  }

  Folio.findById(id)
    .exec()
    .then(folio => {
      if (!folio) throw "No existe el folio"

      return folio.remove()
    })
    .then(folio => {
      return RESP._200(res, "Se elimino el folio", [
        { tipo: "folio", datos: folio }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando el folio"))
})

app.post("/", permisos.$("folio:crear"), (req, res) => {
  new Folio(req.body)
    .save()
    .then(folio => {
      return RESP._200(res, "Se guardo el folio", [
        { tipo: "folio", datos: folio }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error guardando el folio"))
})

app.get(
  "/buscar/id/:id",
  permisos.$("folio:leer:id"),
  (req, res) => {
    Folio.findById(req.params.id)
      .exec()
      .then(folio => {
        if (!folio) throw "No existe el folio"

        return RESP._200(res, null, [{ tipo: "folio", datos: folio }])
      })
      .catch(err =>
        erro(res, err, "Hubo un error obteniendo el folio por su id")
      )
  }
)

app.put("/", permisos.$("folio:modificar"), (req, res) => {
  Folio.findById(req.body._id)
    .exec()
    .then(folio => {
      if (!folio) throw "No existe el folio"
      ;[
        "cliente",
        "vendedor",
        "observaciones",
        "observacionesVendedor",
        "folioLineas",
        "nivelDeUrgencia",
        "porcentajeAvance",
        "terminado",
        "cantidadProducida"
      ].forEach(x => (folio[x] = req.body[x]))
      return folio.save()
    })
    .then(folio => {
      return RESP._200(res, "Se modifico el folio", [
        { tipo: "folio", datos: folio }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error modificando el folio"))
})

app.get(
  "/folioImpreso/:id",
  permisos.$("folio:marcarComoImpreso"),
  (req, res) => {
    Folio.findById(req.params.id)
      .then(folio => {
        if (!folio) throw "No existe el folio."
        folio.impreso = true
        return folio.save()
      })
      .then(() => {
        return RESP._200(res, null, [
          //  { tipo: 'folio', datos: folio },
        ])
      })
      .catch(err => {
        return RESP._500(res, {
          msj: "Hubo un error marcando el folio como impreso. ",
          err: err
        })
      })
  }
)

/**
 * Senala el folio con ordenes impresas.
 */
app.post(
  "/ordenesImpresas",
  permisos.$("folio:modificar:senalarOrdenesImpresas"),
  (req, res) => {
    Folio.findById(req.body._id)
      .then(folioEncontrado => {
        if (!folioEncontrado) {
          return RESP._400(res, {
            msj: "No existe el folio.",
            err: "El id del folio que ingresaste no existe."
          })
        }
        folioEncontrado.impreso = true
        return folioEncontrado.save()
      })
      .then(folioGrabado => {
        return RESP._200(res, null, [{ tipo: "folio", datos: folioGrabado }])
      })
      .catch(err => {
        return RESP._500(res, {
          msj: "Hubo un error buscando el folio para senalarlo como impreso",
          err: err
        })
      })
  }
)

app.get(
  "/detalle/orden/:folio/:pedido/:orden",
  permisos.$("folio:detalle:orden"),
  (req, res) => {
    Folio.findById(req.params.folio)
      .exec()

      .then(folio => {
        if (!folio) throw "No existe el folio"

        const orden = folio.folioLineas
          .id(req.params.pedido)
          .ordenes.id(req.params.orden)

        if (!orden) throw "No existe la orden"

        return RESP._200(res, null, [{ tipo: "orden", datos: orden }])
      })
      .catch(err =>
        erro(res, err, "Hubo un error obteniendo el detalle de la orden")
      )
  }
)
app.get(
  "/detalle/pedido/:folio/:pedido",
  permisos.$("folio:detalle:pedido"),
  (req, res) => {
    Folio.findById(req.params.folio)
      .exec()

      .then(folio => {
        if (!folio) throw "No existe el folio"

        const pedido = folio.folioLineas.id(req.params.pedido)

        if (!pedido) throw "No existe el pedido"

        return RESP._200(res, null, [{ tipo: "pedido", datos: pedido }])
      })
      .catch(err =>
        erro(res, err, "Hubo un error obteniendo el detalle del pedido")
      )
  }
)
app.get(
  "/detalle/folio/:folio",
  permisos.$("folio:detalle:folio"),
  (req, res) => {
    Folio.findById(req.params.folio)
      .exec()

      .then(folio => {
        if (!folio) throw "No existe el folio"

        return RESP._200(res, null, [{ tipo: "folio", datos: folio }])
      })
      .catch(err =>
        erro(res, err, "Hubo un error obteniendo el detalle del folio ")
      )
  }
)

app.get(
  "/reporte/paraRevision",
  permisos.$("folio:reporte:paraRevision"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "fechaDeEntregaAProduccion")

    const total = await Folio.aggregate([
      {
        $match: {
          ordenesGeneradas: false,
          terminado: false
        }
      },

      { $count: "total" }
    ]).exec()

    Folio.aggregate([
      {
        $match: {
          ordenesGeneradas: false,
          terminado: false,
          entregarAProduccion: true
        }
      },

      { $unwind: { path: "$folioLineas", preserveNullAndEmptyArrays: true } },

      {
        $group: {
          _id: "$_id",
          folio: { $first: "$$ROOT" },
          totalDePiezas: { $sum: "$folioLineas.cantidad" }
        }
      },
      { $addFields: { "folio.totalDePiezas": "$totalDePiezas" } },
      { $replaceRoot: { newRoot: "$folio" } },
      {
        $project: {
          folio: "$numeroDeFolio",
          idFolio: "$_id",
          cliente: "$cliente",
          idCliente: "$cliente",
          vendedor: "$vendedor",
          idVendedor: "$vendedor",
          fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
          totalDePiezas: "$totalDePiezas"
        }
      },
      {
        $lookup: {
          from: "clientes",
          foreignField: "_id",
          localField: "cliente",
          as: "cliente"
        }
      },
      { $unwind: { path: "$cliente" } },
      {
        $addFields: { cliente: "$cliente.nombre" }
      },
      {
        $lookup: {
          from: "usuarios",
          foreignField: "_id",
          localField: "vendedor",
          as: "vendedor"
        }
      },
      { $unwind: { path: "$vendedor" } },
      {
        $addFields: { vendedor: "$vendedor.nombre" }
      },

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } }
    ])
      .then(folios => {
        return RESP._200(res, null, [
          { tipo: "folios", datos: folios },
          { tipo: "total", datos: total }
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error obteniendo el reporte de folios para revision"
        )
      )
  }
)

app.get(
  "/filtrar",
  permisos.$("folio:filtrar"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "folio")

    delete req.query.desde
    delete req.query.limite
    delete req.query.sort
    delete req.query.campo

    // Hay tres elementos que deben ser objecto id. Hacemos un
    // hard code para convertirlos

    if (req.query["cliente"]) req.query.cliente = ObjectId(req.query.cliente)
    if (req.query["vendedor"]) req.query.vendedor = ObjectId(req.query.vendedor)

    if (req.query["folioLineas.modeloCompleto"]) {
      req.query["folioLineas.modeloCompleto"] = ObjectId(
        req.query["folioLineas.modeloCompleto"]
      )
    }
    if (req.query.hasOwnProperty("folioLineas.laserado")) {
      var ob = {}

      const esLaserado = req.query["folioLineas.laserado"]

      if (esLaserado) {
        ob["$and"] = [
          {
            "folioLineas.laserCliente.laser": { $not: { $eq: null } }
          },
          {
            "folioLineas.laserCliente.laser": {
              $exists: true
            }
          }
        ]
      } else {
        ob["$and"] = [
          {
            "folioLineas.laserCliente.laser": { $eq: null }
          },
          {
            "folioLineas.laserCliente.laser": {
              $exists: false
            }
          }
        ]
      }

      req.query = { ...req.query, ...ob }

      delete req.query["folioLineas.laserado"]
    }

    //Separam que aplican a los filtros por que
    // asi podemos retornar todo mas limpio como pedidos.

    console.log(`req.query`, req.query["$and"])

    var $folio = null
    var $pedido = null

    Object.keys(req.query).forEach(x => {
      console.log(`x`, typeof x)
      if (x.includes("folioLineas.") || x.includes("$and")) {
        if (!$pedido) $pedido = { $match: {} }
        $pedido.$match[x] = req.query[x]
      } else {
        if (!$folio) $folio = { $match: {} }
        $folio.$match[x] = req.query[x]
      }
    })

    var agg = []

    if ($folio) agg.push($folio)
    agg.push({
      $unwind: { path: "$folioLineas", preserveNullAndEmptyArrays: true }
    })
    if ($pedido) agg.push($pedido)

    agg = agg.concat([
      { $unset: "folioLineas.ordenes" },
      {
        $project: {
          idFolio: "$_id",
          idPedido: "$folioLineas._id",
          folio: "$numeroDeFolio",
          idCliente: "$cliente",
          idVendedor: "$vendedor",
          idSKU: "$folioLineas.modeloCompleto",
          fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
          fechaTerminadoFolio: "$fechaTerminado",
          fechaTerminadoPedido: "$folioLineas.fechaTerminado",
          cantidadProducidaFolio: "$cantidadProducida",
          porcentajeAvanceFolio: "$porcentajeAvance",
          //Datos sobre el pedido
          pedido: "$folioLineas.pedido",
          laserCliente: "$folioLineas.laserCliente.laser",

          porcentajeAvancePedido: "$folioLineas.porcentajeAvance",
          cantidadProducidaPedido: "$folioLineas.cantidadProducida",

          cantidadSolicitadaPedido: "$folioLineas.cantidad"
        }
      },
      { $unset: "_id" },
      // <!--
      // =====================================
      //  Cliente
      // =====================================
      // -->
      {
        $lookup: {
          from: "clientes",
          foreignField: "_id",
          localField: "idCliente",
          as: "cliente"
        }
      },
      { $unwind: { path: "$cliente" } },

      { $addFields: { cliente: "$cliente.nombre" } },
      // <!--
      // =====================================
      //  END Cliente
      // =====================================
      // -->

      // <!--
      // =====================================
      //  Vendedor
      // =====================================
      // -->

      {
        $lookup: {
          from: "usuarios",
          foreignField: "_id",
          localField: "idVendedor",
          as: "vendedor"
        }
      },
      { $unwind: { path: "$vendedor" } },

      { $addFields: { vendedor: "$vendedor.nombre" } },

      // <!--
      // =====================================
      //  END Vendedor
      // =====================================
      // -->
      // <!--
      // =====================================
      //  sku
      // =====================================
      // -->

      {
        $lookup: {
          from: "modelosCompletos",
          foreignField: "_id",
          localField: "idSKU",
          as: "sku"
        }
      },
      { $unwind: { path: "$sku" } },

      { $addFields: { sku: "$sku.nombreCompleto" } }

      // <!--
      // =====================================
      //  END Vendedor
      // =====================================
      // -->
    ])

    //Obtenemos el total de elementos filtrados para la paginacion
    const aggTotal = agg.concat([{ $count: "total" }])
    const total = await Folio.aggregate(aggTotal).exec()

    agg = agg.concat([
      //Primera ordeneda para que todo entre bien al limte antes de cortar.
      // De otra manera cortamos y luego ordenamos dando mal los datos.
      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } }
    ])

    Folio.aggregate(agg)
      .exec()
      .then(foliosConsulta => {
        return RESP._200(res, null, [
          { tipo: "pedidos", datos: foliosConsulta },
          { tipo: "total", datos: total[0] ? total[0] : 0 }
        ])
      })
      .catch(err => erro(res, err, "Hubo un error obteniendo "))
  }
)

app.get(
  "/porEntregarAProduccion/:vendedor",
  permisos.$("folio:porEntregarAProduccion:vendedor"),
  (req, res) => {
    Folio.aggregate([
      {
        $match: {
          vendedor: ObjectId(req.params.vendedor),
          ordenesGeneradas: false,
          entregarAProduccion: false,
          terminado: false
        }
      },
      {
        $project: {
          folio: "$numeroDeFolio",
          cliente: "$cliente",
          fechaDeCreacion: "$createdAt"
        }
      },
      {
        $lookup: {
          from: "clientes",
          foreignField: "_id",
          localField: "cliente",
          as: "cliente"
        }
      },

      { $unwind: { path: "$cliente", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          cliente: "$cliente.nombre",
          idCliente: "$cliente._id"
        }
      }
    ])
      .exec()
      .then(folios => {
        return RESP._200(res, null, [{ tipo: "folios", datos: folios }])
      })
  }
)

app.put(
  "/retornarAlVendedor",
  permisos.$("folio:retornarAlVendedor"),
  (req, res) => {
    const id = req.body.id

    Folio.findById(id)
      .exec()
      .then(folio => {
        if (!folio) throw "No existe el folio"
        if (folio.ordenesGeneradas)
          throw "Imposible retornar. Las ordenes ya estan generadas"
        ;(folio.entregarAProduccion = false),
          (folio.fechaDeEntregaAProduccion = null),
          folio.folioLineas.forEach(pedido => {
            pedido.ordenesGeneradas = false
            pedido.trayectoGenerado = false
            pedido.porcentajeDeAvance = false
            pedido.ordenes = []
          })
        return folio.save()
      })
      .then(respuesta => {
        return RESP._200(res, "Se retorno el folio al vendedor", [])
      })
      .catch(err =>
        erro(res, err, "Hubo un error retornando el folio al vendedor")
      )
  }
)

/**
 * Senala el folio listo para produccion o no dependiendo de
 * que valor tenga la bandera. que se le pase como parametro.
 *
 */
app.put(
  "/entregarARevision",
  permisos.$("folio:entregarARevision"),
  (req, res) => {
    Folio.updateOne(
      { _id: ObjectId(req.body._id) },
      { entregarAProduccion: true, fechaDeEntregaAProduccion: new Date() }
    )
      .exec()
      .then(respuesta => {
        if (respuesta.nModified != 1)
          throw "No se pudo enviar el folio a produccion"

        return RESP._200(res, "Folio enviado a produccion", [])
      })
      .catch(err => {
        return RESP._500(res, {
          msj: "Hubo un error buscando el folio.",
          err: err
        })
      })
  }
)

app.put(
  "/liberarParaProduccion",
  permisos.$("folio:liberarParaProduccion"),
  (req, res) => {
    return res.send("No existe")
  }
)

module.exports = app
