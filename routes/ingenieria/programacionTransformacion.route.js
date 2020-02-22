const express = require("express")
const app = express()
const Maquina = require("../../models/maquina")
const RESP = require("../../utils/respStatus")

const Folio = require("../../models/folios/folio")
const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.post("/asignar", (req, res) => {
  /**
   * Valores que recibimos
   *
   * @param idMaquina: string
   * @param ordenes: [{
   *      folio:string,
   *      pedido:string,
   *      orden:string,
   *      modeloCompleto: string, //Solo para facilitarnos la vida
   *      pasos: Number, //La cantidad de pasos que tiene la orden
   *      numeroDeOrden: string, //El numero de orden (con respecto a
   *      los procesos) para facilitarnos la vida.
   *      numerosDeOrden: [Number], // Los numeros de orden (procesos) pero
   *      juntos para saber que paso es este dato de orden
   *      paso: Number //Si es primer paso, 2do paso, etc.
   * }]
   *
   *
   *
   */
  const datos = req.body

  Maquina.findById(datos.idMaquina)
    .exec()
    .then(maquina => {
      if (!maquina) throw " No existe  la maquina."

      return Maquina.update(
        { _id: maquina.id },
        { $set: { pila: datos.ordenes } }
      ).exec()
    })
    .then(maquina => {
      return RESP._200(res, "Se agregaron de manera correcta las ordenes", [
        { tipo: "maquina", datos: maquina }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error asignando las ordenes"))
})

app.delete("/desasignar", (req, res) => {
  /**
   * Valores que recibimos
   *
   * @param idMaquina: string
   * @param idsPila: string [] El id correspondiente al valor del arreglo.
   *
   *
   *
   */
  const datos = req.body

  Maquina.findById(datos.idMaquina)
    .exec()
    .then(maquina => {
      if (!maquina) throw "No existe la maquina"

      datos.idsPila.forEach(id => maquina.pila.id(id).remove())

      return maquina.save()
    })
    .then(maquina => {
      return RESP._200(
        res,
        "Se elimino la relacion de las ordenes con las maquinas",
        [{ tipo: "maquina", datos: maquina }]
      )
    })
    .catch(err =>
      erro(res, err, "Hubo un error quitando la asignacion de las ordenes")
    )
})

// app.get("/estaAsignada", (req, res) => {
//   const datos = req.body

//   Maquina.aggregate([
//     {
//       $match: {
//         pila: {
//           folio: datos.folio,
//           pedido: datos.pedido,
//           orden: datos.orden
//         }
//       }
//     }
//   ])
//     .exec()
//     .then(maquinas => {
//       if (!maquinas)
//         return RESP._200(res, null, [{ tipo: "correcto", datos: true }])

//       if (err) {
//         return RESP._500(res, {
//           msj: `Esta orden ya esta asignada a la maquina ${maquinas[0].nombre}`,
//           err: err,
//           masInfo: [
//             {
//               infoAdicional:
//                 CONST.ERRORES.MAS_INFO.TIPO_ERROR.NO_DATA.infoAdicional,
//               dataAdicional:
//                 CONST.ERRORES.MAS_INFO.TIPO_ERROR.NO_DATA.dataAdicional
//             }
//           ]
//         })
//       }
//     })
//     .catch(err =>
//       erro(res, err, "Hubo un error comprobando si la orden esta asignada")
//     )
// })

app.get("/ordenesPorAsignar/:id", async (req, res) => {
  //El id actual de transformacion
  const idT = req.params.id

  //Buscamos todas las maquinas y obtenemos todas las ordenes
  // que estan asignadas en pila. Con su idOrden vamos
  // a quitar de este reporte las que ya esten asignadas
  var ordenesAsignadas = null
  Maquina.aggregate([
    {
      //Solo las maquinas que tengan ordenes en la pila
      $match: { pila: { $exists: true, $ne: [] } }
    },
    {
      $unwind: { path: "$pila" }
    },

    {
      $project: {
        folio: "$pila.folio",
        pedido: "$pila.pedido",
        orden: "$pila.orden",
        paso: "$pila.paso"
      }
    }
  ])
    .exec()
    .then(ordAs => {
      ordenesAsignadas = ordAs
      // Si son dos pasos obtenemos dos ordenes, si son tres, 3 ordenes, etc.
      //  De esta manera vamos a guardar en la maquina el tipo de paso que la orden va a estar haciendo comparandolo contra la ubicacion actual que tenemos.

      return Folio.aggregate([
        {
          $match: {
            // Folios sin terminar
            terminado: false
          }
        },
        {
          $unwind: {
            path: "$folioLineas"
          }
        },

        {
          $match: {
            // Pedidos sin terminar y con
            // ordenes generadas
            "folioLineas.terminado": false,
            "folioLineas.ordenesGeneradas": true
          }
        },
        {
          $unwind: {
            path: "$folioLineas.ordenes"
          }
        },
        {
          $match: {
            "folioLineas.ordenes.terminada": false,
            //El campo no debe de existir para
            //saber que no esta asignada.
            "folioLineas.ordenes.maquinaActual": {
              $exists: false,
              $eq: null
            }
          }
        },
        {
          $unwind: {
            path: "$folioLineas.ordenes.trayectoNormal"
          }
        },

        //El id de trasnformacion . De esta manera obtener solo las ordenes
        // que tienen que pasar por transformacion.
        {
          $match: {
            "folioLineas.ordenes.trayectoNormal.departamento": ObjectId(idT)
          }
        },
        {
          // Agrupamos por que solo nos interesan los id del folio, pedido y orden.
          $group: {
            _id: {
              folio: "$_id",
              pedido: "$folioLineas._id",
              orden: "$folioLineas.ordenes._id",
              numeroDeOrden: "$folioLineas.ordenes.orden",
              modeloCompleto: "$folioLineas.ordenes.modeloCompleto", //solo para referencia
              ubicacionActual: "$folioLineas.ordenes.ubicacionActual"
            },
            //Los trayectos que coinciden con el id que le pasamos.
            //De esta manera sabemos si esta por encima de la ubicacion
            // actual y quitamos el trayecto (Por ejemplo, ya paso por segundo paso, entonces no hay que mostrar el segundo paso.)

            trayectos: { $push: "$folioLineas.ordenes.trayectoNormal" },
            //Este nos sirve para referenciar
            numerosDeOrden: {
              $push: "$folioLineas.ordenes.trayectoNormal.orden"
            },
            pasos: { $sum: 1 }
          }
        },

        //Ahora separamos de nuevo el arreglo de trayectos para hacer un match
        // contra el numero de 'orden' que tiene la ubicacion actual. Si es menor
        // no debe de aparecer. Si es igual, quiere decir que esta trabajando o
        // pendiente de trabajar. (disponible?) y si es mayor todavia no llega.

        {
          $unwind: {
            path: "$trayectos"
          }
        },

        {
          $match: {
            $expr: { $lte: ["$_id.ubicacionActual.orden", "$trayectos.orden"] }
          }
        },
        {
          $project: {
            folio: "$_id.folio",
            pedido: "$_id.pedido",
            orden: "$_id.orden",
            modeloCompleto: "$_id.modeloCompleto",
            numeroDeOrden: "$_id.numeroDeOrden",
            ubicacionActual: "$_id.ubicacionActual",
            trayectos: "$trayectos",
            pasos: "$pasos",
            numerosDeOrden: "$numerosDeOrden"
          }
        },
        { $unset: ["_id"] },
        {
          $lookup: {
            from: "modelosCompletos",
            localField: "modeloCompleto",
            foreignField: "_id",
            as: "modeloCompleto"
          }
        },
        { $unwind: "$modeloCompleto" },
        { $addFields: { modeloCompleto: "$modeloCompleto.nombreCompleto" } }
      ]).exec()
    })
    .then(ordenes => {
      /**
       * Obtenemos esta estructura:
       *
       *  "folio": "5e42e62e880ee5445c477d21",
       *    "pedido": "5e42e62e880ee5445c477d22",
       *    "orden": "5e42e647880ee5445c477d8e",
       *    "o": "81-0-1",
       *    "ubicacionActual": {
       *        "recivida": false,
       *        "_id": "5e42e647880ee5445c477dac",
       *        "departamento": "5c6f07f6a6fd170abc390913",
       *        "entrada": "2020-02-11T17:37:11.983Z",
       *        "orden": "0"
       *    },
       *    "trayectos": {
       *        "recivida": false,
       *        "_id": "5e42e647880ee5445c477da5",
       *        "orden": "3",
       *        "departamento": "5c6f07f6a6fd170abc39091b"
       *    },
       *    "pasos": 2,
       *    "numerosDeOrden": [
       *        "3",
       *        "5"
       *    ]
       *  Ahora vamos a clasificar cada una de estas ordenes como primero, segundo, ...., pasos.
       *
       *
       *
       */

      ordenes.map(orden => (orden["paso"] = obtenerPaso(orden)))

      //Quitamos las ordenes que ya estan asignadas.a
      ordenes = ordenes.filter(x => {
        return !(
          ordenesAsignadas.filter(
            oa => oa.orden.toString() == x.orden.toString() && oa.paso == x.paso
          ).length > 0
        )
      })

      res.send({ ordenes })
    })
    .catch(err =>
      erro(res, err, "Hubo un error comprobando si la orden esta asignada")
    )
})

/**
 *Obtiene el numero correspondiente al paso en que esta la orden.
 *
 */
function obtenerPaso(orden) {
  const actual = orden.ubicacionActual.orden * 1
  const trayecto = orden.trayectos.orden * 1

  const paso = orden.numerosDeOrden.findIndex(x => x * 1 === trayecto)

  if (paso < 0) throw "No se encontro el paso de la orden"

  return paso + 1
}

module.exports = app
