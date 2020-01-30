var express = require("express")
var app = express()
var RESP = require("../../utils/respStatus")

var RepoFalProdTer = require("./reporte.faltanteProductoTerminado")
var RepoFalAlmaProd = require("./reporte.faltanteAlmacenProduccion")

const mongoose = require("mongoose")

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
app.get("/almacenDeProduccion/faltantes", (req, res) => {
  var datosReporte = null
  // Genera los reportes faltanes.
  RepoFalAlmaProd.aggregate()
    .exec()
    .then(datos => {
      //Calculamos los consumos.
      const calculoDeDias = dias => dias * 24 * 60 * 60 * 1000
      const dias = {
        _7: new Date(new Date().getTime() - calculoDeDias(7)),
        _30: new Date(new Date().getTime() - calculoDeDias(30)),
        _365: new Date(new Date().getTime() - calculoDeDias(365))
      }


app.get("/almacenDeProduccion/faltantes", (req, res) => {
  var datosReporte = null
  // Genera los reportes faltanes.
  RepoFalAlmaProd.aggregate()
    .exec()
    .then(datos => {
      //Calculamos los consumos.
      const calculoDeDias = dias => dias * 24 * 60 * 60 * 1000
      const dias = {
        _7: new Date(new Date().getTime() - calculoDeDias(7)),
        _30: new Date(new Date().getTime() - calculoDeDias(30)),
        _365: new Date(new Date().getTime() - calculoDeDias(365))
      }

      for (const key in dias) {
        const fecha = dias[key]
        datos.forEach(articulo => {
          articulo[key] = articulo.salidas.filter(
            salida => salida.fecha > fecha
          )
        })
      }

      datosReporte = datos

      return RepoFalAlmaProd.requisicionesPendientes(
        datosReporte.map(x => x._id)
      )
    })
    .then(requisiciones => {
      // Unimos las requisiciones encontradas con sus respectivos
      // match de articulos
      datosReporte.forEach(dato => {
        dato["requisicionesPendientes"] = requisiciones.filter(r => {
          return r.articulo + "" == dato._id + ""
        })

        dato["enCamino"] = dato.requisicionesPendientes.reduce((a, b) => {
          return a + (b.cantidad - b.cantidadEntregadaALaFecha)
        }, 0)

        delete dato.salidas
      })

      return RESP._200(res, "datos hasta el momento", [
        // { tipo: "reporte", datos: datos }
        { tipo: "reporte", datos: datosReporte }
      ])
    })
    .catch(err =>
      erro(
        res,
        err,
        "Hubo un error generan el reporte de faltantes del almacen de produccion"
      )
    )
})

module.exports = app
