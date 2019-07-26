//Esto es necesario
var express = require("express")
var ModeloCompleto = require("../../models/modeloCompleto")
var Folio = require("../../models/folios/folio")
var RESP = require("../../utils/respStatus")
var app = express()

const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

var CRUD = require("../CRUD")
CRUD.app = app
CRUD.modelo = ModeloCompleto
CRUD.nombreDeObjetoSingular = "modeloCompleto"
CRUD.nombreDeObjetoPlural = "modelosCompletos"
CRUD.campoSortDefault = "nombreCompleto"
CRUD.camposActualizables = {
  medias: null,
  laserAlmacen: null,
  versionModelo: null,
  familiaDeProcesos: null,
  procesosEspeciales: null,
  nombreCompleto: null,
  porcentajeDeMerma: null,
  espesor: null
}

CRUD.camposDeBusqueda = ["nombreCompleto"]

CRUD.crud()

app.get("/transito/:id", (req, res) => {
  let id = req.params.id

  if (!id) {
    return RESP._500(res, {
      msj: "No definiste el id del modelo",
      err: "Es necesario que definas el id. "
    })
  }

  let arregloRedact = []

  // Solo nos interesan folios que no esten terminados
  // y que ya se hayan entregado a produccion.
  arregloRedact.push(
    {
      $match: {
        terminado: false,
        entregarAProduccion: true,
        ordenesGeneradas: true
      }
    },

    // Obtenemos los pedidos que coincidan contra el modelo. (Es con el id)
    {
      $match: {
        "folioLineas.modeloCompleto": ObjectId(id)
      }
    },
    {
      $project: {
        folio: "$$ROOT",
        pedidosFiltrados: {
          $filter: {
            // La nueva propiedad que se va crear para poder traer solo los
            // pedidos que coincidan.
            input: "$folioLineas",
            cond: {
              // Solo mos interesa el modelo del que vamos
              // a obtener su produccion
              $eq: ["$$this.modeloCompleto", ObjectId(id)]
            }
          }
        }
      }
    },

    {
      // Sustituimos los pedidos.
      $addFields: {
        "folio.folioLineas": "$pedidosFiltrados"
      }
    },
    {
      // Establecemos el root para dejarlo todo como estaba.
      $replaceRoot: { newRoot: "$folio" }
    },
    {
      $unwind: { path: "$folioLineas", preserveNullAndEmptyArrays: true }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$folioLineas.cantidad" }
      }
    },

    { $project: { _id: 0, total: 1 } }
  )

  // Hacemos un match de los

  Folio.aggregate(arregloRedact)
    .then((resp) =>
    {


      if (resp.length === 0)
      {
        return RESP._200(res, null , [
            { tipo: 'total', datos: 0 },
        ]);
        
      }
      return RESP._200(res, null , [
          { tipo: 'total', datos: resp[0].total },
      ]);
      
    })
    .catch((err) => {
      return RESP._500(res, {
        msj: "Hubo un error al obtener la produccion en transito",
        err: err
      })
    })
})

// <!--
// =====================================
//  Modificar Stock
// =====================================
// -->

app.post("/stock", (req, res) => {
  let datos = req.body

  ModeloCompleto.findById(datos._id)
    .exec()
    .then((mc) => modificarStock(datos, mc))
    .then((mcModificado) => _200_ModificarStock(res, mcModificado))
    .catch((err) => error(res, "Hubo un error modificando el stock", err))
})

function modificarStock(datos, mc) {
  if (!mc) throw "El id que ingresaste no existe."
  mc.stockMinimo = datos.stockMinimo
  mc.stockMaximo = datos.stockMaximo
  return mc.save()
}

function _200_ModificarStock(res, mcModificado) {
  return RESP._200(res, "Se modifico el stock exitosamente", [
    { tipo: "modeloCompleto", datos: mcModificado }
  ])
}

function error(res, msj, err) {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

// <!--
// =====================================
//  END Modificar Stock
// =====================================
// -->

module.exports = app
