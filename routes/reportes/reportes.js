var express = require("express")
var app = express()
var RESP = require("../../utils/respStatus")

var RepoFalProdTer = require("./reporte.faltanteProductoTerminado")
var RepoFalAlmaProd = require("./reporte.faltanteAlmacenProduccion")

var RepoPers = require("../../models/almacenRefaccionesYMateriaPrima/reportePersonalizadoAlmacenProduccion.model")

var Articulo = require("../../models/almacenRefaccionesYMateriaPrima/articulo.model")

const Folio = require("../../models/folios/folio")
const Proceso = require("../../models/procesos/proceso")
const SKU = require("../../models/modeloCompleto")
const Empleado = require("../../models/recursosHumanos/empleados/empleado.model")

const mongoose = require("mongoose")

var guard = require("express-jwt-permissions")()
var permisos = require("../../config/permisos.config")
const { exists } = require("../../models/procesos/proceso")

// <!--
// =====================================
//  Este route se encarga de generar todos los reportes
//  que necesitamos.
// =====================================
// -->

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.get(
  "/productoTerminado/faltantes",
  permisos.$("reportes:productoTerminado:faltes"),
  (req, res) => {
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
          { tipo: "reporte", datos: datosReporte },
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error generan el reporte de faltantes de producto terminado"
        )
      )
  }
)

app.get("/productoTerminado/salidas", (req, res, next) => {
  SKU.aggregate([
    { $match: { "lotes.1": { $exists: true } } },
    {
      $project: {
        familia: "$familiaDeProcesos",
        esBaston: 1,
        lotes: 1,
        sku: "$nombreCompleto",
        parte: 1,
      },
    },

    { $unwind: { path: "$lotes", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        familia: 1,
        esBaston: 1,
        sku: 1,
        parte: 1,
        "lotes.salidas": 1,
      },
    },
    { $unwind: { path: "$lotes.salidas", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        familia: 1,
        esBaston: 1,
        sku: 1,
        parte: 1,
        cliente: "$lotes.salidas.cliente",
        cantidad: "$lotes.salidas.cantidad",
        observaciones: "$lotes.salidas.observaciones",
        fechaSalida: "$lotes.salidas.createdAt",
      },
    },

    {
      $match: {
        fechaSalida: {
          $gte: req.query.inferior,
          $lte: req.query.superior,
        },
      },
    },

    {
      $lookup: {
        from: "familiadeprocesos",
        foreignField: "_id",
        localField: "familia",
        as: "familia",
      },
    },

    {
      $addFields: {
        familia: "$familia.nombre",
        familiaObservaciones: "$familia.observaciones",
      },
    },

    {
      $unwind: {
        path: "$familia",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$familiaObservaciones",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "clientes",
        foreignField: "_id",
        localField: "cliente",
        as: "cliente",
      },
    },

    {
      $addFields: {
        cliente: "$cliente.nombre",
      },
    },

    {
      $unwind: {
        path: "$cliente",
        preserveNullAndEmptyArrays: true,
      },
    },
  ])
    .exec()
    .then(x => res.send(x))
    .catch(_ => next(_))
})

app.get("/productoTerminado/entradas", (req, res, next) => {
  SKU.aggregate([
    { $match: { "lotes.1": { $exists: true } } },
    {
      $project: {
        familia: "$familiaDeProcesos",
        esBaston: 1,
        lotes: 1,
        sku: "$nombreCompleto",
        parte: 1,
      },
    },

    { $unwind: { path: "$lotes", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        familia: 1,
        esBaston: 1,
        sku: 1,
        parte: 1,
        "lotes.entradas": 1,
      },
    },
    { $unwind: { path: "$lotes.entradas", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        familia: 1,
        esBaston: 1,
        sku: 1,
        parte: 1,
        // cliente: "$lotes.entradas.cliente",
        cantidad: "$lotes.entradas.cantidad",
        observaciones: "$lotes.entradas.observaciones",
        fechaEntrada: "$lotes.entradas.createAt",
      },
    },

    {
      $match: {
        fechaEntrada: {
          $gte: req.query.inferior,
          $lte: req.query.superior,
        },
      },
    },

    {
      $lookup: {
        from: "familiadeprocesos",
        foreignField: "_id",
        localField: "familia",
        as: "familia",
      },
    },

    {
      $addFields: {
        familia: "$familia.nombre",
        familiaObservaciones: "$familia.observaciones",
      },
    },

    {
      $unwind: {
        path: "$familia",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$familiaObservaciones",
        preserveNullAndEmptyArrays: true,
      },
    },

    { $unset: ["_id"] },
  ])
    .exec()
    .then(x => res.send(x))
    .catch(_ => next(_))
})

app.get(
  "/almacenDeProduccion/faltantes",
  permisos.$("reportes:almacenDeProduccion:faltantes"),
  (req, res) => {
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
          _365: new Date(new Date().getTime() - calculoDeDias(365)),
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
          { tipo: "reporte", datos: datosReporte },
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error generan el reporte de faltantes del almacen de produccion"
        )
      )
  }
)

app.get(
  "/almacenDeProduccion/personalizado/:id",
  permisos.$("reportes:almacenDeProduccion:personalizado:id"),
  (req, res) => {
    var articulosRepo = null

    RepoPers.findById(req.params.id)
      .exec()
      .then(reporte => {
        if (!reporte) throw "No existe el reporte"

        return Articulo.find({ _id: { $in: reporte.articulos } })
          .lean()
          .exec()
      })
      .then(articulos => {
        articulosRepo = articulos
        return RepoFalAlmaProd.requisicionesPendientes(
          articulos.map(x => x._id)
        )
      })
      .then(requisiciones => {
        articulosRepo.map(articulo => {
          articulo["enTransito"] = requisiciones.filter(
            req => req.articulo + "" === articulo._id + ""
          )
        })
        articulosRepo = agregarCalculoDeDias(articulosRepo)

        return RESP._200(res, "Se genero el reporte", [
          { tipo: "reportes", datos: articulosRepo },
        ])
      })
      .catch(err =>
        erro(res, err, "Hubo un error generando el reporte personalizado")
      )
  }
)

function agregarCalculoDeDias(datos) {
  const calculoDeDias = dias => dias * 24 * 60 * 60 * 1000
  const dias = {
    _7: new Date(new Date().getTime() - calculoDeDias(7)),
    _30: new Date(new Date().getTime() - calculoDeDias(30)),
    _365: new Date(new Date().getTime() - calculoDeDias(365)),
  }

  for (const key in dias) {
    const fecha = dias[key]
    datos.forEach(articulo => {
      articulo[key] = articulo.salidas.filter(salida => salida.fecha > fecha)
    })
  }

  return datos
}

function validarFechas(desde, hasta) {
  if (!desde)
    return next(
      new Error("Falta definir el limite inferior del rango de la fecha")
    )
  if (!hasta)
    return next(
      new Error("Falta definir el limite superior del rango de la fecha")
    )
}

app.get("/controlDeProduccion/tiempoDeProcesosPorOrden", (req, res, next) => {
  let desde = req.query.inferior
  let hasta = req.query.superior

  validarFechas(desde, hasta)

  let ordenesEncontradas = null
  Folio.aggregate([
    {
      $match: {
        fechaDeEntregaAProduccion: { $gte: desde },
      },
    },

    {
      $project: {
        folio: "$numeroDeFolio",
        cliente: "$cliente",
        fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
        folioLineas: "$folioLineas",
        vendedor: "$vendedor",
      },
    },

    {
      $unwind: {
        path: "$folioLineas",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        cliente: 1,
        fechaDeEntregaAProduccion: 1,
        folio: 1,
        vendedor: 1,
        "folioLineas.modeloCompleto": "$folioLineas.modeloCompleto",
        "folioLineas.laserCliente": "$folioLineas.laserCliente",
        "folioLineas.almacen": "$folioLineas.almacen",
        "folioLineas.ordenes": "$folioLineas.ordenes",
      },
    },
    {
      $unwind: {
        path: "$folioLineas.ordenes",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        idFolio: "$_id",
        cliente: 1,
        fechaDeEntregaAProduccion: 1,
        numeroDeFolio: 1,
        vendedor: 1,
        modeloCompleto: "$folioLineas.modeloCompleto",
        laserCliente: "$folioLineas.laserCliente",
        almacen: "$folioLineas.almacen",
        orden: "$folioLineas.ordenes.orden",
        unidad: "$folioLineas.ordenes.unidad",
        piezasTeoricas: "$folioLineas.ordenes.piezasTeoricas",
        piezasFinales: "$folioLineas.ordenes.piezasFinales",
        ruta: "$folioLineas.ordenes.ruta",
        terminada: "$folioLineas.ordenes.terminada",
        fechaFinalizacion: { $last: "$folioLineas.ordenes.ruta.salida" },
      },
    },
    {
      $unset: [
        "_id",
        "ruta._id",
        "ruta.recibida",
        // "ruta.datos",
        "ruta.ubicacionActual",
      ],
    },
    {
      $match: {
        terminada: true,
      },
    },

    {
      $addFields: {
        diasDeProceso: {
          $divide: [
            { $subtract: ["$fechaFinalizacion", "$fechaDeEntregaAProduccion"] },

            { $multiply: [1000, 60, 60, 24] },
          ],
        },
      },
    },

    {
      $unwind: {
        path: "$ruta",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        "ruta.idDepartamento": { $toObjectId: "$ruta.idDepartamento" },
        "ruta.idProceso": { $toObjectId: "$ruta.idProceso" },
      },
    },

    {
      $lookup: {
        from: "departamentos",
        foreignField: "_id",
        localField: "ruta.idDepartamento",
        as: "ruta.departamento",
      },
    },
    {
      $lookup: {
        from: "procesos",
        foreignField: "_id",
        localField: "ruta.idProceso",
        as: "ruta.proceso",
      },
    },

    {
      $unwind: {
        path: "$ruta.departamento",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$ruta.proceso",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        "ruta.proceso": "$ruta.proceso.nombre",
        "ruta.departamento": "$ruta.departamento.nombre",
      },
    },

    {
      $addFields: {
        "ruta.diasDeProceso": {
          $divide: [
            { $subtract: ["$ruta.salida", "$ruta.recepcion"] },
            { $multiply: [1000, 60, 60, 24] },
          ],
        },
      },
    },

    {
      $group: {
        _id: {
          vendedor: "$vendedor",
          numeroDeFolio: "$numeroDeFolio",
          idCliente: { $toObjectId: "$cliente" },
          fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
          idFolio: "$idFolio",
          sku: { $toObjectId: "$modeloCompleto" },
          laserCliente: "$laserCliente.laser",
          almacen: "$almacen",
          orden: "$orden",
          unidad: "$unidad",
          piezasTeoricas: "$piezasTeoricas",
          piezasFinales: "$piezasFinales",
          terminada: "$terminada",
          fechaFinalizacion: "$fechaFinalizacion",
          diasDeProceso: "$diasDeProceso",
        },

        ruta: { $push: "$ruta" },
      },
    },

    {
      $addFields: {
        "_id.ruta": "$ruta",
      },
    },

    {
      $replaceRoot: { newRoot: "$_id" },
    },
    {
      $lookup: {
        from: "clientes",
        foreignField: "_id",
        localField: "idCliente",
        as: "cliente",
      },
    },

    {
      $addFields: {
        cliente: "$cliente.nombre",
      },
    },
    {
      $lookup: {
        from: "usuarios",
        foreignField: "_id",
        localField: "vendedor",
        as: "vendedor",
      },
    },

    {
      $unwind: {
        path: "$vendedor",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        vendedor: "$vendedor.nombre",
        idVendedor: "$vendedor._id",
      },
    },

    {
      $unwind: {
        path: "$cliente",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "modelosCompletos",
        foreignField: "_id",
        localField: "sku",
        as: "sku",
      },
    },

    {
      $addFields: {
        sku: "$sku.nombreCompleto",
        familia: "$sku.familiaDeProcesos",
        laserAlmacen: "$sku.laserAlmacen.laser",
      },
    },

    {
      $unwind: {
        path: "$sku",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$familia",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$laserAlmacen",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "familiadeprocesos",
        foreignField: "_id",
        localField: "familia",
        as: "familia",
      },
    },

    {
      $addFields: {
        familia: "$familia.nombre",
        familiaObservaciones: "$familia.observaciones",
      },
    },

    {
      $unwind: {
        path: "$familia",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$familiaObservaciones",
        preserveNullAndEmptyArrays: true,
      },
    },
  ])
    .exec()
    .then(ordenes => {
      ordenesEncontradas = ordenes

      return Proceso.find().lean().exec()
    })
    .then(procesos => {
      ordenesEncontradas = ordenesEncontradas.map(orden => {
        procesos.forEach(pro => {
          let ruta = orden.ruta.find(ruta => {
            return ruta?.idProceso?.toString() === pro._id.toString()
          })

          let proLimpio = pro.nombre.split(" ").join("_")
          orden[`dp_${proLimpio}`] = ruta ? ruta.diasDeProceso : 0
          orden[`dp_relativo_${proLimpio}`] = 0

          //Contiene los datos para defectos

          if (ruta?.datos?.hasOwnProperty("quebrados")) {
            ;[
              "quebrados",
              "reves",
              "despostillado",
              "sinLaser",
              "sinHoyos",
              "efectoMalo",
              "otros",
            ].forEach(x => {
              orden["defecto_" + x] = ruta.datos[x] ? ruta.datos[x] : 0
            })
          }
        })

        let fechaAnterior = null
        for (let i = 0; i < orden.ruta.length; i++) {
          const ruta = orden.ruta[i]

          if (!fechaAnterior) {
            fechaAnterior = ruta.salida
            continue
          }

          let diferencia = new Date(ruta.salida) - new Date(fechaAnterior)

          let diferenciaDias = diferencia / 1000 / 60 / 60 / 24
          let proLimpio = ruta.proceso.split(" ").join("_")
          let propiedad = "dp_relativo_" + proLimpio

          orden[propiedad] = diferenciaDias

          fechaAnterior = ruta.salida
        }
        orden.ruta.forEach(ruta => {
          if (ruta.departamento) {
            let depaLimpio = ruta.departamento.replace(/\s/g, "_")
            let proLimpio = ruta.proceso.replace(/\s/g, "_")
            let nombreVariable = `DATOPRO`

            if (ruta.datos) {
              Object.keys(ruta.datos).forEach(keyDatos => {
                if (keyDatos === "_id") return

                // Pastilla puede tener cantidades que corresponden a la version anterior. Si es asi hacemos esto.
                if (keyDatos === "cantidades") {
                  let contador = 1

                  ruta.datos[keyDatos].forEach(cantidadObject => {
                    Object.keys(cantidadObject).forEach(keyCantidad => {
                      if (keyCantidad === "_id") return
                      orden[
                        `${nombreVariable}_${depaLimpio}_${proLimpio}_${keyCantidad}${contador}`
                      ] = cantidadObject[keyCantidad]
                    })

                    contador++
                  })
                } else {
                  orden[
                    `${nombreVariable}_${depaLimpio}_${proLimpio}_${keyDatos}`
                  ] = ruta.datos[keyDatos]
                }
              })
            }
          }
        })

        delete orden.ruta

        return orden
      })

      res.send(ordenesEncontradas)
    })
    .catch(err => next(err))
})

app.get("/rh/empleados", (req, res, next) => {
  Empleado.find()
    .select("-_id -eventos -__v -asistencia -hijos")
    .then(empleados => res.send(empleados))
    .catch(err => next(err))
})
module.exports = app
