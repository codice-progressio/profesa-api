var Articulo = require("../../models/almacenRefaccionesYMateriaPrima/articulo.model")
var Requisiciones = require("../../models/requisiciones/requisicion.model")

/**
 * Genera un reporte sobre todos los faltantes de almacen que tengan
 * asignado un minimo y que esten por debajo de el o igual a el.
 */
module.exports.aggregate = function(_idArticulos) {
  return Articulo.aggregate([
    {
      $match: {
        $and: [
          {
            stockMinimo: { $gt: 0 }
          },
          { $expr: { $lte: ["$existencia", "$stockMinimo"] } }
        ]
      }
    },
    {
      $project: {
        _id: "$_id",
        nombre: "$nombre",
        descripcion: "$descripcion",
        presentacion: "$presentacion",
        stockMinimo: "$stockMinimo",
        stockMaximo: "$stockMaximo",
        existencia: "$existencia",
        pedir: { $subtract: ["$stockMaximo", "$existencia"] },
        salidas: "$salidas"
      }
    }
  ])
}

module.exports.requisicionesPendientes = function(idArticulos) {
  return Requisiciones.aggregate([
    {
      $match: {
        "estatus.esTerminada": false,
        "estatus.esCancelada": false,
        articulo: { $in: idArticulos }
      }
    },
    {
      $project: {
        _id: "$_id",
        materiaPrima: "$materiaPrima",
        consumibles: "$consumibles",
        gastosYServicios: "$gastosYServicios",
        cantidad: "$cantidad",
        articulo: "$articulo",
        razonDeCambioTemp: "$razonDeCambioTemp",
        esRequisicion: "$estatus.esRequisicion",
        cantidadEntregadaALaFecha: "$estatus.cantidadEntregadaALaFecha",
        esOrdenDeCompra: "$estatus.esOrdenDeCompra",
        fechaDeGeneracionDeOrdenDeCompra:
          "$estatus.fechaDeGeneracionDeOrdenDeCompra",
        fechaTermino: "$estatus.fechaTermino",
        esEntregaParcial: "$estatus.esEntregaParcial",
        fechaEntregaParcialidad: "$estatus.fechaEntregaParcialidad",
        usuario: "$usuario",
        createdAt: "$createdAt",
        folio: "$folio"
      }
    }
  ])
}
