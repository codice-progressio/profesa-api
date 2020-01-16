var express = require("express")
var app = express()
var Requisicion = require("../../models/requisiciones/requisicion.model")
var requisicionFiltros = require("./requisicion.filtros")
var RESP = require("../../utils/respStatus")

var error = (err, res, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

var respuesta = (reqSave, res, tipo, msj) => {
  return RESP._200(res, msj, [{ tipo: tipo, datos: reqSave }])
}

app.post("/", (req, res) => {
  const r = new Requisicion(req.body)

  r.save(req.body)
    .then(requisicion => respuesta(requisicion, res, "requisicion", null))
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error guardando la requisicion",
        err: err
      })
    })
})

app.put("/", (req, res) => {
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
        "observaciones"
      ].forEach(x => {
        requisicion[x] = req.body[x]
      })

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
        err: err
      })
    })
})

app.delete("/:id", (req, res) => {
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
        err: err
      })
    })
})

app.get("/:id", (req, res) => {
  Requisicion.findById(req.params.id)
    .exec()
    .then(requisicion => {
      if (!requisicion) throw "No existe la requisicion"

      respuesta(requisicion, res, "requisicion", null)
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error buscando por id la requisicion",
        err: err
      })
    })
})

// <!--
// =====================================
//  Get con busqueda fina
// =====================================
// -->

app.get("/", (req, res) => {
  var b = requisicionFiltros.obtenerFiltros(req.query)

  let arregloRedact = requisicionFiltros.generarArregloRedact(b)
  Requisicion.aggregate(arregloRedact)
    .then(resp => {
      var requisiciones = resp[0] ? resp[0].requisiciones : []
      var total = resp[0] ? resp[0].total : 0

      //Quitamos la contrase;a
      requisiciones.forEach(x => (x.usuario.password = ":D"))

      return RESP._200(res, null, [
        { tipo: "requisiciones", datos: requisiciones },
        { tipo: "total", datos: total }
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
function estatusEsRequisicion(requisicion, requisicionBody) {
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
  // Se dispara el pre-validate
  return requisicion.save()
}

app.put("/estatus/actualizar/:id", (req, res) => {
  obtenerRequisicion(req.params.id)
    // Pasamos toda la requisicion pero solo vamos a utilizar
    // el estatus.
    .then(requisicion => estatusEsRequisicion(requisicion, req.body))
    .then(requisicion =>
      respuesta(requisicion, res, "requisicioin", ' "Estatus modificado."')
    )
    .catch(err => error(err, res, "Hubo un error modificando el status"))
})

// <!--
// =====================================
//  END Modificar el estatus de la requisicion
// =====================================
// -->

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app
