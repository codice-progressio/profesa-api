var express = require("express")
var app = express()
var Requisicion = require("../../models/requisiciones/requisicion.model")
var requisicionFiltros = require("./requisicion.filtros")
var RESP = require("../../utils/respStatus")

var CRUD = require("../CRUD")
CRUD.app = app
CRUD.modelo = Requisicion
CRUD.nombreDeObjetoSingular = "requisicion"
CRUD.nombreDeObjetoPlural = "requisiciones"
CRUD.campoSortDefault = "folio"
CRUD.camposActualizables = {
  // estandar: null,
}

CRUD.camposDeBusqueda = ["folio"]

CRUD.camposActualizables = {
  materiaPrima: null,
  consumibles: null,
  gastosYServicios: null,
  cantidad: null,
  articulo: null
}

CRUD.crud("getById", "getBuscar", "post", "delete", "put")

var error = (err, res, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

var respuesta = (reqSave, res, tipo, msj) => {
  return RESP._200(res, msj, [{ tipo: tipo, datos: reqSave }])
}

// <!--
// =====================================
//  Get con busqueda fina
// =====================================
// -->

app.get("/", (req, res) =>
{
  var b = requisicionFiltros.obtenerFiltros(req.query)

  let arregloRedact = requisicionFiltros.generarArregloRedact(b)
  Requisicion.aggregate(arregloRedact)
    .then((resp) => {
      var requisiciones = resp[0] ? resp[0].requisiciones : []
      var total = resp[0] ? resp[0].total : 0

      //Quitamos la contrase;a
      requisiciones.forEach((x) => (x.usuario.password = ":D"))

      return RESP._200(res, null, [
        { tipo: "requisiciones", datos: requisiciones },
        { tipo: "total", datos: total }
      ])
    })
    .catch((err) => error(err, res, "Hubo un error buscando las requisiciones"))
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
  requisicionBody.estatus.cantidadEntregadaALaFecha =
  (requisicionBody.estatus.cantidadEntregadaALaFecha+
    requisicion.estatus.cantidadEntregadaALaFecha).toPrecision(3)

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
    .then((requisicion) => estatusEsRequisicion(requisicion, req.body))
    .then((requisicion) =>
      respuesta(requisicion, res, "requisicioin", ' "Estatus modificado."')
    )
    .catch((err) => error(err, res, "Hubo un error modificando el status"))
})

// <!--
// =====================================
//  END Modificar el estatus de la requisicion
// =====================================
// -->

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app
