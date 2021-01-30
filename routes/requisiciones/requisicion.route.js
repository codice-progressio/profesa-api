const express = require("express")
const app = express()
const Requisicion = require("../../models/requisiciones/requisicion.model")
const RESP = require("../../utils/respStatus")

const guard = require("express-jwt-permissions")()
const $ =  require("@codice-progressio/easy-permissions").$

const ObjectId = require("mongoose").Types.ObjectId

const error = (err, res, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

const respuesta = (reqSave, res, tipo, msj) => {
  return RESP._200(res, msj, [{ tipo: tipo, datos: reqSave }])
}

function actualizarHistorial(r, user) {
  r.historialDeEstatus.unshift({
    estatus: r.estatus,
    razonDeCambio: r.razonDeCambioTemp
      ? r.razonDeCambioTemp
      : `EL USUARIO '${user.name}' NO DEFINIO LA RAZON `,
    usuarioQueModifica: user,
  })

  return r
}

app.post("/", $("requisicion:crear"), (req, res) => {
  const r = new Requisicion(req.body)
  r.usuario = req.user

  actualizarHistorial(r, req.user)

  r.save(req.body)
    .then(requisicion => respuesta(requisicion, res, "requisicion", null))
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error guardando la requisicion",
        err: err,
      })
    })
})

app.put("/", $("requisicion:modificar"), (req, res) => {
  Requisicion.findById(req.body._id)
    .exec()
    .then(requisicion => {
      if (!requisicion) throw "No existe la requisicion"
      ;[
        "materiaPrima",
        "consumibles",
        "gastosYServicios",
        "cantidad",
        "articulo",
        "observaciones",
      ].forEach(x => {
        requisicion[x] = req.body[x]
      })

      requisicion = actualizarHistorial(requisicion, req.user)
      return requisicion.save()
    })
    .then(requisicion =>
      respuesta(
        requisicion,
        res,
        "requisicion",
        "Se modifico la requisicion de manera correcta"
      )
    )
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error actualizando la requisicion",
        err: err,
      })
    })
})

app.delete("/:id", $("requisicion:eliminar"), (req, res) => {
  Requisicion.findById(req.params.id)
    .exec()
    .then(requisicion => {
      if (!requisicion) throw "No existe la requisicion"
      return requisicion.remove()
    })
    .then(requi =>
      respuesta(
        requi,
        res,
        "requisicion",
        "Se elimino la requisicion de manera correcta"
      )
    )
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error eliminando la requisicion",
        err: err,
      })
    })
})

app.get("/buscar/id/:id", $("requisicion:leer:id"), (req, res) => {
  Requisicion.findById(req.params.id)
    .exec()
    .then(requisicion => {
      if (!requisicion) throw "No existe la requisicion"

      respuesta(requisicion, res, "requisicion", null)
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error buscando por id la requisicion",
        err: err,
      })
    })
})

// <!--
// =====================================
//  Get con busqueda fina
// =====================================
// -->

app.get("/", $("requisicion:leer:todo"), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "folio")

  //Eliminamos para que no aparezcan en el query
  delete req.query.desde
  delete req.query.limite
  delete req.query.sort
  delete req.query.campo

  // var b = requisicionFiltros.obtenerFiltros(req.query)

  // let arregloRedact = requisicionFiltros.generarArregloRedact(b)

  //Contiene usuario
  if (req.query.usuario) req.query.usuario = ObjectId(req.query.usuario)
  if (req.query.articulo) req.query.articulo = ObjectId(req.query.articulo)

  const agg = []

  //Si hay elementos en el query quiere decir que hay filtros.
  // Los agregamos
  if (req.query) {
    agg.push({
      $match: req.query,
    })
  } else {
    agg.push({
      $match: { kkjdfk: { $exist: false } },
    })
  }

  agg.push(
    {
      $lookup: {
        from: "articulos",
        foreignField: "_id",
        localField: "articulo",
        as: "articulo",
      },
    },

    { $unwind: { path: "$articulo", preserveNullAndEmptyArrays: true } },
    { $unset: ["articulo.salidas", "articulo.entradas"] },
    {
      $lookup: {
        from: "usuarios",
        foreignField: "_id",
        localField: "usuario",
        as: "usuario",
      },
    },

    { $unwind: { path: "$usuario", preserveNullAndEmptyArrays: true } },
    { $unset: ["usuario.password", "articulo.permissions"] }
  )

  const aggTotal = agg.concat([{ $count: "total" }])

  //Ordenamos y limitamos todo
  agg.push(
    //Primera ordeneda para que todo entre bien al limte antes de cortar.
    // De otra manera cortamos y luego ordenamos dando mal los datos.
    { $sort: { [campo]: sort } },
    //Desde aqui limitamos unicamente lo que queremos ver
    { $limit: desde + limite },
    { $skip: desde },
    { $sort: { [campo]: sort } }
  )

  const total = await Requisicion.aggregate(aggTotal).exec()

  Requisicion.aggregate(agg)
    .then(requisiciones => {
      return RESP._200(res, null, [
        { tipo: "requisiciones", datos: requisiciones },
        { tipo: "total", datos: total[0] ? total[0].total : 0 },
      ])
    })
    .catch(err => error(err, res, "Hubo un error buscando las requisiciones"))
})

// <!--
// =====================================
//  END Get con busqueda fina
// =====================================
// -->

function obtenerRequisicion(id) {
  return Requisicion.findById(id).exec()
}

// <!--
// =====================================
//  Modificar el estatus de la requisicion
// =====================================
// -->
function estatusEsRequisicion(requisicion, requisicionBody, user) {
  // Sumamos la cantidadRecivida a la fecha
  requisicionBody.estatus.cantidadEntregadaALaFecha = (
    requisicionBody.estatus.cantidadEntregadaALaFecha +
    requisicion.estatus.cantidadEntregadaALaFecha
  ).toPrecision(3)

  //Copiamos las facturas para  que no haga el cambio
  // ya que las facturas las guardamos directamente
  // cuando se suben. (Los nombres. )
  requisicionBody.estatus.imagenesFacturas =
    requisicion.estatus.imagenesFacturas

  // Copiamos solo el estatus por si hubo alguna otra
  // modificacion a la requisicion.
  requisicion.estatus = requisicionBody.estatus

  // Copiamos la razon de cambio tamben para que
  // se guarde dentro del historial en el pre - validate
  requisicion.razonDeCambio = requisicionBody.razonDeCambio

  requisicion = actualizarHistorial(requisicion, user)

  return requisicion.save()
}

app.put(
  "/estatus/actualizar/:id",
  $("requisicion:estatus:actualizar"),
  (req, res) => {
    obtenerRequisicion(req.params.id)
      // Pasamos toda la requisicion pero solo vamos a utilizar
      // el estatus.
      .then(requisicion =>
        estatusEsRequisicion(requisicion, req.body, req.user)
      )
      .then(requisicion =>
        respuesta(requisicion, res, "requisicioin", ' "Estatus modificado."')
      )
      .catch(err => error(err, res, "Hubo un error modificando el status"))
  }
)

// <!--
// =====================================
//  END Modificar el estatus de la requisicion
// =====================================
// -->

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app
