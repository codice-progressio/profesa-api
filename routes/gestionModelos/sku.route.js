//Esto es necesario
var express = require("express")
var SKU = require("../../models/sku.model")
var Folio = require("../../models/folios/folio")
var RESP = require("../../utils/respStatus")
var app = express()

const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

var permisos = require("../../config/permisos.config")

const Parametros = require("../../models/defautls/parametros.model")

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.post("/", permisos.$("sku:crear"), (req, res) => {
  new SKU(req.body)
    .save()
    .then(sku => {
      return RESP._200(res, "Se guardo el sku", [{ tipo: "sku", datos: sku }])
    })
    .catch(err => erro(res, err, "Hubo un error guardo el sku"))
})

app.get("/", permisos.$("sku:leer:todo"), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombreCompleto")

  const total = await SKU.countDocuments()

  SKU.aggregate([
    { $match: { noExiste: { $exists: false } } },

    {
      $lookup: {
        from: "familiadeprocesos",
        foreignField: "_id",
        localField: "familiaDeProcesos",
        as: "familiaDeProcesos",
      },
    },

    {
      $unwind: {
        path: "$familiaDeProcesos",
        preserveNullAndEmptyArrays: true,
      },
    },
    //Fin de populacion

    { $sort: { [campo]: sort } },
    //Desde aqui limitamos unicamente lo que queremos ver
    { $limit: desde + limite },
    { $skip: desde },
    { $sort: { [campo]: sort } },
    {
      $project: {
        nombreCompleto: "$nombreCompleto",
        existencia: "$existencia",
        stockMaximo: "$stockMaximo",
        stockMinimo: "$stockMinimo",
        medias: "$medias",
        familiaDeProcesos: "$familiaDeProcesos.nombre",
        familiaDeProcesosId: "$familiaDeProcesos._id",
        parte: "$parte",
      },
    },
  ])
    .exec()
    .then(modelosCompletos => {
      //Si no hay resultados no se crea la propiedad
      // y mas adelante nos da error.

      return RESP._200(res, null, [
        { tipo: "modelosCompletos", datos: modelosCompletos },
        { tipo: "total", datos: total },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando los sku"))
})

app.get("/buscar/id/:id", permisos.$("sku:leer:id"), (req, res) => {
  SKU.findById(req.params.id)
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "sku", datos: sku }])
    })
    .catch(err => erro(res, err, "Hubo un error buscando el sku por su id"))
})

app.get(
  "/buscar/termino/:termino",
  permisos.$("sku:leer:termino"),
  async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombreCompleto")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" },
    })

    const $match = {
      $or: [],
    }

    ;["nombreCompleto"].forEach(x => $match.$or.push(b(x)))

    const total = await SKU.aggregate([{ $match }, { $count: "total" }]).exec()

    SKU.aggregate([
      { $match },

      {
        $lookup: {
          from: "familiadeprocesos",
          foreignField: "_id",
          localField: "familiaDeProcesos",
          as: "familiaDeProcesos",
        },
      },

      {
        $unwind: {
          path: "$familiaDeProcesos",
          preserveNullAndEmptyArrays: true,
        },
      },
      //Fin de populacion

      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
      {
        $project: {
          nombreCompleto: "$nombreCompleto",
          existencia: "$existencia",
          stockMaximo: "$stockMaximo",
          stockMinimo: "$stockMinimo",
          familiaDeProcesos: "$familiaDeProcesos.nombre",
          familiaDeProcesosId: "$familiaDeProcesos._id",
          parte: "$parte",
        },
      },
    ])
      .exec()
      .then(modelosCompletos => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })

        return RESP._200(res, null, [
          { tipo: "modelosCompletos", datos: modelosCompletos },
          { tipo: "total", datos: total.pop().total },
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error buscando los sku por el termino " + termino
        )
      )
  }
)

app.get("/todoParaExcel", (req, res, next) => {
  SKU.aggregate([
    { $match: { hola: { $exists: false } } },
    {
      $project: {
        familiaDeProcesos: "$familiaDeProcesos",
        nombreCompleto: "$nombreCompleto",
        existencia: "$existencia",
        esBaston: "$esBaston",
        stockMinimo: "$stockMinimo",
        stockMaximo: "$stockMaximo",
        parte: "$parte",
      },
    },
    {
      $unset: "_id",
    },

    {
      $lookup: {
        from: "familiadeprocesos",
        foreignField: "_id",
        localField: "familiaDeProcesos",
        as: "familiaDeProcesos",
      },
    },
    {
      $unwind: {
        preserveNullAndEmptyArrays: true,
        path: "$familiaDeProcesos",
      },
    },

    {
      $addFields: {
        familiaDeProcesos: "$familiaDeProcesos.nombre",
        familiaDeProcesosObservaciones: "$familiaDeProcesos.observaciones",
      },
    },
  ])
    .exec()
    .then(datos => {
      return res.json(datos)
    })
    .catch(_ => next(_))
})

app.delete("/:id", permisos.$("sku:eliminar"), (req, res) => {
  SKU.findById(req.params.id)
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el sku"

      return sku.remove()
    })
    .then(sku => {
      return RESP._200(res, "Se elimino de manera correcta", [
        { tipo: "sku", datos: sku },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando el sku"))
})

app.put("/", permisos.$("sku:modificar"), (req, res) => {
  SKU.findById(req.body._id)
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el sku"
      ;[
        "medias",
        "laserAlmacen",
        "versionModelo",
        "familiaDeProcesos",
        "procesosEspeciales",
        "nombreCompleto",
        "porcentajeDeMerma",
        "espesor",
        "terminado",
      ].forEach(x => (sku[x] = req.body[x]))

      return sku.save()
    })
    .then(sku => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "sku", datos: sku },
      ])
    })
    .catch(err => erro(res, err, "Hubo un error actualizando el sku"))
})

app.put(
  "/setearParte",
  permisos.$("sku:modificar:parte"),
  async (req, res, next) => {
    if (!req.parametros.actualizaciones.partes) {
      try {
        await SKU.updateMany({}, { parte: "C" }).exec()
        await Parametros.updateOne(
          {},
          { "actualizaciones.partes": true }
        ).exec()
      } catch (error) {
        return next(error)
      }
    }
    SKU.findById(req.body._id)
      .exec()
      .then(sku => {
        if (!sku) throw "No existe el sku"
        sku.parte = req.body.parte
        return sku.save()
      })
      .then(sku => {
        return RESP._200(
          res,
          `Se agrego ${sku.nombreCompleto} a las partes ${sku.parte}`,
          [{ tipo: "sku", datos: sku }]
        )
      })
      .catch(err => erro(res, err, "Hubo un error actualizando el sku"))
  }
)

app.get("/transito/:id", permisos.$("sku:leer:transito"), (req, res) => {
  let id = req.params.id

  if (!id) {
    return RESP._500(res, {
      msj: "No definiste el id del modelo",
      err: "Es necesario que definas el id. ",
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
        ordenesGeneradas: true,
      },
    },

    { $unwind: { path: "$folioLineas" } },

    // Obtenemos los pedidos que coincidan contra el modelo. (Es con el id)
    {
      $match: {
        "folioLineas.sku": ObjectId(id),
        "folioLineas.terminado": false,
      },
    },

    { $unwind: { path: "$folioLineas.ordenes" } },

    { $match: { "folioLineas.ordenes.terminada": false } },

    {
      $group: {
        _id: null,
        total: { $sum: "$folioLineas.ordenes.piezasTeoricas" },
      },
    },
    { $replaceRoot: { newRoot: { total: "$total" } } }
  )

  // Hacemos un match de los

  Folio.aggregate(arregloRedact)
    .then(resp => {
      return RESP._200(res, null, [
        { tipo: "total", datos: resp[0] ? resp[0].total : 0 },
      ])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error al obtener la produccion en transito",
        err: err,
      })
    })
})

// <!--
// =====================================
//  Modificar Stock
// =====================================
// -->

app.post("/stock", permisos.$("sku:stock:modificar"), (req, res) => {
  let datos = req.body

  SKU.findById(datos._id)
    .exec()
    .then(mc => modificarStock(datos, mc))
    .then(mcModificado => _200_ModificarStock(res, mcModificado))
    .catch(err => error(res, "Hubo un error modificando el stock", err))
})

function modificarStock(datos, mc) {
  if (!mc) throw "El id que ingresaste no existe."
  mc.stockMinimo = datos.stockMinimo
  mc.stockMaximo = datos.stockMaximo
  return mc.save()
}

function _200_ModificarStock(res, mcModificado) {
  return RESP._200(res, "Se modifico el stock exitosamente", [
    { tipo: "sku", datos: mcModificado },
  ])
}

function error(res, msj, err) {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

// <!--
// =====================================
//  END Modificar Stock
// =====================================
// -->

module.exports = app
