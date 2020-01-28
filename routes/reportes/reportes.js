var express = require("express")
var app = express()
var RESP = require("../../utils/respStatus")
var Folio = require("../../models/folios/folio")
var Default = require("../../models/configModels/default")
var colores = require("../../utils/colors")
var ModeloCompleto = require("../../models/modeloCompleto")

var RepoFalProdTer = require("./reporte.faltanteProductoTerminado")

const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

// <!--
// =====================================
//  Este route se encarga de generar todos los reportes
//  que necesitamos.
// =====================================
// -->

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.get("/productoTerminado/faltantes", (req, res) => {
  // Genera los reportes faltanes.

  var datosReporte = null
  RepoFalProdTer.aggregate()
    .exec()

    .then(datos => {
      datosReporte = datos
      return RepoFalProdTer.materialEnProceso(datos.map(x => x._id)).exec()
    })
    .then(enProceso => {
      const clasPed = {}
      datosReporte.forEach(x => (clasPed[x._id] = []))
      enProceso.forEach(x => {
        var arreglo = clasPed[x.modeloCompleto]

        arreglo.push(x)
      })

      datosReporte.map(mod => {
        mod["ordenesEnTransito"] = clasPed[mod._id]

        //Sumamos lo que esta en transito (cantida) menos lo
        // que ya esta terminado (cantidadProducida)
        var total = 0
        mod.ordenesEnTransito.map(x => {
          total += x.cantidad
        })
        mod["enTransito"] = total

        return mod
      })

      return RESP._200(res, "datos hasta el momento", [
        { tipo: "reporte", datos: datosReporte }
      ])
    })
    .catch(err =>
      erro(
        res,
        err,
        "Hubo un error generan el reporte de faltantes de producto terminado"
      )
    )
})

module.exports = app
