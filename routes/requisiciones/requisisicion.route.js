var express = require("express")
var app = express()
var Requisicion = require("../../models/requisiciones/requisicion.model")

var RESP = require("../../utils/respStatus")

var CRUD = require("../CRUD")
CRUD.app = app
CRUD.modelo = Requisicion
CRUD.nombreDeObjetoSingular = "Requisicion"
CRUD.nombreDeObjetoPlural = "Requisiciones"
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

CRUD.crud("get", "getById", "getBuscar", "post", "delete", 'put')

function obtenerRequisicion(id) {
  return Requisicion.findById(id).exec()
}

var error = (err, res) => {
  return RESP._500(res, {
    msj: "Hubo un error modificando el status.L0",
    err: err
  })
}

var respuesta = (reqSave, res) => {
  return RESP._200(res, "Estatus modificado.", [
    { tipo: "requisicion", datos: reqSave }
  ])
}



// <!-- 
// =====================================
//  Modificar el estatus de la requisicion
// =====================================
// -->
function estatusEsRequisicion(requisicion, estatus) {
    requisicion.estatus = estatus
    // Se dispara la 
  return requisicion.save()
}

app.put("/estatus/actualizar/:id", (req, res) => {
  obtenerRequisicion(req.params.id)
    .then((requisicion) => estatusEsRequisicion(requisicion, req.body))
    .then((requisicion) => respuesta(requisicion, res))
    .catch((err) => error(err, res))
})

// <!-- 
// =====================================
//  END Modificar el estatus de la requisicion
// =====================================
// -->




// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app
