var ModeloCompleto = require("../../models/modeloCompleto")
var Folio = require("../../models/folios/folio")
const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

module.exports.aggregate = function() {
  return ModeloCompleto.aggregate([
    {
      $match: {
        $and: [
          //Debe de tener un stock para que lo
          // tomemos en cuenta
          { stockMinimo: { $gt: 0 } },
          // La existencia debe ser menor que el stock
          // minimo
          { $expr: { $lte: ["$existencia", "$stockMinimo"] } }
        ]
      }
    },

    {
      $project: {
        _id: "$_id",
        nombreCompleto: "$nombreCompleto",
        stockMinimo: "$stockMinimo",
        stockMaximo: "$stockMaximo",
        existencia: "$existencia",
        pedir: { $subtract: ["$stockMaximo", "$existencia"] }
      }
    }
  ])
}

module.exports.materialEnProceso = function(modelosArray) {
  return Folio.aggregate([
    {
      $match: {
        terminado: false,
        ordenesGeneradas: true
      }
    },
    {
      $unwind: {
        path: "$folioLineas",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $match: {
        "folioLineas.modeloCompleto": {
          $in: modelosArray.map(x => ObjectId(x))
        }
      }
    },
    {
      $unwind: {
        path: "$folioLineas.ordenes",
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $match: {
        "folioLineas.ordenes.terminada": false
      }
    },

    {
      $project: {
        idFolio: "$_id",
        idPedido: "$folioLineas.idFolioLineas",
        idOrden: "$folioLineas.ordenes._id",
        orden: "$folioLineas.ordenes.orden",
        cliente: "$cliente",
        vendedor: "$vendedor",
        observacionesVendedor: "$observacionesVendedor",
        observaciones: "$observaciones",
        cantidad: "$folioLineas.ordenes.piezasTeoricas",
        observacionesPedido: "$folioLineas.observaciones",
        observacionesVendedorPedido: "$folioLineas.observacionesVendedor",
        modeloCompleto: "$folioLineas.modeloCompleto"
      }
    },
    {
      $lookup: {
        from: "clientes",
        localField: "cliente",
        foreignField: "_id",
        as: "cliente"
      }
    },
    {
      $unwind: {
        path: "$cliente",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "usuarios",
        localField: "vendedor",
        foreignField: "_id",
        as: "vendedor"
      }
    },
    {
      $unwind: {
        path: "$vendedor",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unset: [
        "vendedor.role",
        "vendedor.google",
        "vendedor.password",
        "cliente.laserados",
        "cliente.modelosCompletosAutorizados"
      ]
    }
  ])
}
