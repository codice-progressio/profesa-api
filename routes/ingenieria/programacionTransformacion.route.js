const express = require("express")
const app = express()
const Maquina = require("../../models/maquina")
const RESP = require("../../utils/respStatus")

const Departamento = require("../../models/departamento")

const Folio = require("../../models/folios/folio")
const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId
var permisos = require("../../config/permisos.config")
var guard = require("express-jwt-permissions")()

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.post(
  "/asignar",
  permisos.$("programacionTransformacion:asignar"),
  (req, res) => {
    //Recibimos una orden ligera.
    const datos = req.body

    Maquina.findById(datos.idMaquina)
      .exec()
      .then(maquina => {
        if (!maquina) throw "No existe la maquina."

        return Maquina.update(
          { _id: maquina.id },
          { $set: { pila: datos.ordenes } }
        ).exec()
      })
      .then(maquina => {
        return RESP._200(res, "Se modificaron las ordenes", [
          { tipo: "maquina", datos: maquina },
        ])
      })
      .catch(err => erro(res, err, "Hubo un error asignando las ordenes"))
  }
)

app.get(
  "/ordenesPorAsignar",
  permisos.$("programacionTransformacion:ordenesPorAsignar"),
  async (req, res) => {
    //El id actual de transformacion
    const idTransformacion = req.parametros.departamentoTransformacion

    if (!idTransformacion)
      throw "No has definido el proceso correlacionado a transformacion."

    //Buscamos todas las maquinas y obtenemos todas las ordenes
    // que estan asignadas en pila. Con su idOrden vamos
    // a quitar de este reporte las que ya esten asignadas
    var ordenesAsignadas = null
    Maquina.aggregate([
      {
        //Solo las maquinas que tengan ordenes en la pila
        $match: { pila: { $exists: true, $ne: [] } },
      },
      {
        $unwind: { path: "$pila", preserveNullAndEmptyArrays: true },
      },

      {
        $project: {
          folio: "$pila.folio",
          pedido: "$pila.pedido",
          orden: "$pila.orden",
          paso: "$pila.paso",
        },
      },
    ])
      .exec()
      .then(async ordAs => {
        ordenesAsignadas = ordAs
        let maquinasTrabajando = await Maquina.aggregate([
          {
            //Solo las maquinas que tengan trabajo
            $match: { trabajando: { $ne: null, $ne: undefined } },
          },
          //Los datos de la orden en el mismo formato que la pila
          // para filtrarlos de la lista.
          {
            $project: {
              folio: "$trabajo.datos.folio",
              pedido: "$trabajo.datos.pedido",
              orden: "$trabajo.datos.orden",
              paso: "$trabajo.datos.paso",
            },
          },
        ]).exec()

        ordenesAsignadas.push(...maquinasTrabajando)

        // Si son dos pasos obtenemos dos ordenes, si son tres, 3 ordenes, etc.
        //  De esta manera vamos a guardar en la maquina el tipo de paso que la orden va a estar haciendo comparandolo contra la ubicacion actual que tenemos.

        return Folio.aggregate([
          [
            //Folios sin terminar
            {
              $match: {
                terminado: false,
              },
            },
            {
              $unwind: {
                path: "$folioLineas",
                preserveNullAndEmptyArrays: true,
              },
            },
            //Pedidos sin terminar con ordenes generadas.
            {
              $match: {
                "folioLineas.terminado": false,
                "folioLineas.ordenesGeneradas": true,
              },
            },
            {
              $unwind: {
                path: "$folioLineas.ordenes",
                preserveNullAndEmptyArrays: true,
              },
            },
            //Ordenes que no esten terminadas y que
            //no esten asignadas a ninguna maquina.
            {
              $match: {
                "folioLineas.ordenes.terminada": false,
                "folioLineas.ordenes.maquinaActual": {
                  $exists: false,
                  $eq: null,
                },
              },
            },

            //Obtenemos la ubicicacion actual  y lo guardamos
            // en un campo.
            {
              $addFields: {
                //Creamos el campo ubicacionActual
                "folioLineas.ordenes.ubicacionActual": {
                  //Filtramos el arreglo ruta para obtener
                  // solo la ruta que tenga el flag ubicacionActual = true
                  $filter: {
                    input: "$folioLineas.ordenes.ruta",
                    as: "item",
                    cond: {
                      $eq: ["$$item.ubicacionActual", true],
                    },
                  },
                },
              },
            },
            {
              $unwind: {
                path: "$folioLineas.ordenes.ubicacionActual",
                preserveNullAndEmptyArrays: true,
              },
            },

            //Copiamos la orden, una copia por cada ruta que tiene.
            {
              $unwind: {
                path: "$folioLineas.ordenes.ruta",
                preserveNullAndEmptyArrays: true,
              },
            },

            //Quitamos todas las copias que no pertenezcan al departamento
            // de transformacion.
            {
              $match: {
                "folioLineas.ordenes.ruta.idDepartamento": idTransformacion,
              },
            },

            //Agrupamos todo de nuevo.
            {
              $group: {
                //Recuperamos los datos que nos interesan.
                _id: {
                  folio: "$_id",
                  pedido: "$folioLineas._id",
                  orden: "$folioLineas.ordenes._id",
                  numeroDeOrden: "$folioLineas.ordenes.orden",
                  sku: "$folioLineas.sku",
                  idSKU: "$folioLineas.sku",
                  ubicacionActual: "$folioLineas.ordenes.ubicacionActual",
                  fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
                  laser: "$folioLineas.laserCliente.laser",
                  laserAlmacen: "$folioLineas.sku",
                  observacionesOrden: "$folioLineas.ordenes.observaciones",
                  observacionesPedido: "$folioLineas.observaciones",
                  observacionesFolio: "$observaciones",
                  cliente: "$cliente",
                },
                //Aqui estamos obteniendo de nuevo toda la ruta.
                //* */
                rutaParaConsecutivo: {
                  $push: "$folioLineas.ordenes.ruta",
                },

                //Aqui obtenemos los numeros de orden del consecutivo de la ruta .
                numerosDeOrden: {
                  $push: "$folioLineas.ordenes.ruta.consecutivo",
                },
                //Aqui sumamos la cantidad de pasos que tiene la orden.
                // De esta manera sabemos si lleva uno, dos o tres pasos.
                pasos: {
                  $sum: 1,
                },
              },
            },
            //Separamos el arreglo del consecutivo de nuevo para obtener una
            // orden por ruta, asi, si la orden va a entrar dos veces al mismo
            // departamento listamos dos documentos.
            {
              $unwind: {
                path: "$rutaParaConsecutivo",
                preserveNullAndEmptyArrays: true,
              },
            },

            //Filtramos todos los departamentos que esten en su consecutivo de ///ruta por encima de la ruta actual, de manera que solo obtenemos
            //
            {
              $match: {
                $expr: {
                  $lte: [
                    "$_id.ubicacionActual.consecutivo",
                    "$rutaParaConsecutivo.consecutivo",
                  ],
                },
              },
            },
            {
              $project: {
                folio: "$_id.folio",
                pedido: "$_id.pedido",
                orden: "$_id.orden",
                sku: "$_id.sku",
                idSKU: "$_id.idSKU",
                numeroDeOrden: "$_id.numeroDeOrden",
                ubicacionActual: "$_id.ubicacionActual",
                rutaParaConsecutivo: "$rutaParaConsecutivo",
                // rutaTemp: "ruta",
                pasos: "$pasos",
                numerosDeOrden: "$numerosDeOrden",
                fechaDeEntregaAProduccion: "$_id.fechaDeEntregaAProduccion",
                laser: "$_id.laser",
                laserAlmacen: "$_id.laserAlmacen",
                observacionesOrden: "$_id.observacionesOrden",
                observacionesPedido: "$_id.observacionesPedido",
                observacionesFolio: "$_id.observacionesFolio",
                cliente: "$_id.cliente",
              },
            },
            {
              $unset: ["_id"],
            },
            {
              $lookup: {
                from: "modelosCompletos",
                localField: "sku",
                foreignField: "_id",
                as: "sku",
              },
            },
            {
              $unwind: {
                path: "$sku",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                sku: "$sku.nombreCompleto",
                laserAlmacen: "$sku.laserAlmacen.laser",
                esBaston: "$sku.esBaston",
              },
            },
            {
              $lookup: {
                from: "clientes",
                localField: "cliente",
                foreignField: "_id",
                as: "cliente",
              },
            },
            {
              $unwind: {
                path: "$cliente",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                cliente: "$cliente.nombre",
                idCliente: "$cliente._id",
              },
            },
            {
              $project: {
                folio: "$folio",
                pedido: "$pedido",
                orden: "$orden",
                sku: "$sku",
                idSKU: "$idSKU",
                numeroDeOrden: "$numeroDeOrden",
                ubicacionActual: "$ubicacionActual",
                rutaParaConsecutivo: "$rutaParaConsecutivo",
                pasos: "$pasos",
                numerosDeOrden: "$numerosDeOrden",
                fechaDeEntregaAProduccion: "$fechaDeEntregaAProduccion",
                cliente: "$cliente",
                laser: "$laser",
                laserAlmacen: "$laserAlmacen",
                esBaston: "$esBaston",
                idCliente: "$idCliente",
                observacionesOrden: "$observacionesOrden",
                observacionesPedido: "$observacionesPedido",
                observacionesFolio: "$observacionesFolio",
                disponible: {
                  $eq: [
                    {
                      $cmp: [
                        "$ubicacionActual.consecutivo",
                        "rutaParaConsecutivo.consecutivo",
                      ],
                    },
                    0,
                  ],
                },
              },
            },
            {
              $addFields: {
                "ubicacionActual.idDepartamento": {
                  $toObjectId: "$ubicacionActual.idDepartamento",
                },
                "ubicacionActual.idProceso": {
                  $toObjectId: "$ubicacionActual.idProceso",
                },
              },
            },
            {
              $lookup: {
                from: "departamentos",
                localField: "ubicacionActual.idDepartamento",
                foreignField: "_id",
                as: "ubicacionActual.departamento",
              },
            },
            {
              $unwind: {
                path: "$ubicacionActual.departamento",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                "ubicacionActual.departamento":
                  "$ubicacionActual.departamento.nombre",
              },
            },
          ],
        ]).exec()
      })
      .then(ordenes => {
        ordenes.map(orden => (orden["paso"] = obtenerPaso(orden)))
        //Quitamos las ordenes que ya estan asignadas.a
        ordenes = ordenes.filter(x => {
          return !(
            ordenesAsignadas.filter(
              oa =>
                oa.orden?.toString() == x.orden.toString() && oa.paso == x.paso
            ).length > 0
          )
        })

        res.send({ ordenes })
      })
      .catch(err =>
        erro(res, err, "Hubo un error comprobando si la orden esta asignada")
      )
  }
)

/**
 *Obtiene el numero correspondiente al paso en que esta la orden.
 *
 */
function obtenerPaso(orden) {
  const consecutivo = orden.rutaParaConsecutivo.consecutivo * 1

  const paso = orden.numerosDeOrden.findIndex(x => x * 1 === consecutivo)

  if (paso < 0) throw "No se encontro el paso de la orden"

  return paso + 1
}

app.put(
  "/actualizarUbicacion",
  permisos.$("programacionTransformacion:actualizarUbicacion"),
  (req, res) => {
    var datos = null
    Maquina.aggregate([
      {
        //Las maquinas que son de este departamento
        $match: {
          departamentos: {
            $elemMatch: {
              $eq: ObjectId(req.parametros.departamentoTransformacion),
            },
          },
          //Que tenga por lo menos una orden en la pila
          "pila.0": { $exists: true },
        },
      },
      //Solo nos interesa el id de la maquina
      // y su pila de trabajo.
      {
        $project: {
          idMaquina: "$_id",
          pila: "$pila",
        },
      },

      {
        $unwind: {
          path: "$pila",
          preserveNullAndEmptyArrays: true,
        },
      },

      { $addFields: { "pila.folio": { $toObjectId: "$pila.folio" } } },

      // //Populamos los datos
      {
        $lookup: {
          from: "folios",
          localField: "pila.folio",
          foreignField: "_id",
          as: "pila.folio",
        },
      },
      {
        $unwind: {
          path: "$pila.folio",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          idMaquina: "$idMaquina",
          idPila: "$pila._id",
          pila: "$pila",
          folio: "$pila.folio._id",
          pedido: "$pila.pedido",
          orden: "$pila.orden",
        },
      },

      {
        $unwind: {
          path: "$pila.folio.folioLineas",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          idMaquina: "$idMaquina",
          idPila: "$idPila",
          "pila.folio._id": "$pila.folio._id",
          "pila.folio.folioLineas._id": "$pila.folio.folioLineas._id",
          "pila.folio.folioLineas.ordenes": "$pila.folio.folioLineas.ordenes",
          folio: "$folio",
          pedido: "$pedido",
          orden: "$orden",
        },
      },
      {
        $unwind: {
          path: "$pila.folio.folioLineas.ordenes",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          idMaquina: "$idMaquina",
          ordenTemp: "$pila.folio.folioLineas.ordenes",
          idPila: "$idPila",
          "pila.folio._id": "$pila.folio._id",
          "pila.folio.folioLineas._id": "$pila.folio.folioLineas._id",
          "pila.folio.folioLineas.ordenes._id":
            "$pila.folio.folioLineas.ordenes._id",
          "pila.folio.folioLineas.ordenes.ubicacionActual":
            "$pila.folio.folioLineas.ordenes.ubicacionActual",
          folio: { $toObjectId: "$folio" },
          pedido: { $toObjectId: "$pedido" },
          orden: { $toObjectId: "$orden" },
        },
      },
      {
        $project: {
          ordenTemp: 1,
          idMaquina: 1,
          idPila: 1,
          pila: 1,
          folio: 1,
          pedido: 1,
          orden: 1,
          cmp_value_folio: { $cmp: ["$folio", "$pila.folio._id"] },
          cmp_value_pedido: {
            $cmp: ["$pedido", "$pila.folio.folioLineas._id"],
          },
          cmp_value_orden: {
            $cmp: ["$orden", "$pila.folio.folioLineas.ordenes._id"],
          },
        },
      },
      {
        $match: {
          cmp_value_folio: { $eq: 0 },
          cmp_value_pedido: { $eq: 0 },
          cmp_value_orden: { $eq: 0 },
        },
      },
      {
        $project: {
          ordenTemp: 1,
          idMaquina: 1,
          idPila: 1,
          folio: 1,
          pedido: 1,
          orden: 1,
        },
      },

      {
        $unwind: {
          path: "$ordenTemp.ruta",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $match: { "ordenTemp.ruta.ubicacionActual": true },
      },

      { $addFields: { ubicacionActual: "$ordenTemp.ruta" } },
      {
        $addFields: {
          "ubicacionActual.idDepartamento": {
            $toObjectId: "$ubicacionActual.idDepartamento",
          },
        },
      },
      {
        $lookup: {
          from: "departamentos",
          localField: "ubicacionActual.idDepartamento",
          foreignField: "_id",
          as: "ubicacionActual.departamento",
        },
      },
      {
        $unwind: "$ubicacionActual.departamento",
      },
      {
        $unset: "ordenTemp",
      },
      {
        $addFields: {
          "ubicacionActual.departamento":
            "$ubicacionActual.departamento.nombre",
        },
      },
    ])
      .exec()
      .then(dat => {
        // return res.send(dat)
        datos = dat
        return Maquina.find({
          _id: { $in: datos.map(d => d.idMaquina) },
        }).exec()
      })
      .then(maquinas => {
        const promesas = []
        maquinas.forEach(maquina => {
          datos.forEach(d => {
            const ordenLigera = maquina.pila.id(d.idPila)
            if (ordenLigera) {
              ordenLigera.ubicacionActual = d.ubicacionActual
              ordenLigera.disponible =
                d.ubicacionActual.consecutivo ===
                ordenLigera.numerosDeOrden[ordenLigera.paso - 1]
            }
          })

          promesas.push(maquina.save())
        })

        return Promise.all(promesas)
      })
      .then(maquinas => {
        return RESP._200(res, "Se actualizo la ubicacion de las ordenes", [])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error actualizando la ubicaciones de las ordenes"
        )
      )
  }
)

app.get("/maquinas", (req, res, next) => {
  Maquina.aggregate([
    {
      $match: {
        departamentos: ObjectId(req.parametros.departamentoTransformacion),
      },
    },
  ])
    .exec()
    .then(maquinas =>
      RESP._200(res, null, [{ tipo: "maquinas", datos: maquinas }])
    )
    .catch(_ => next(_))
})

module.exports = app
