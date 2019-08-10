//Esto es necesario
var express = require("express")
var app = express()
var Proceso = require("../models/procesos/proceso")
var RESP = require("../utils/respStatus")

var CRUD = require("../routes/CRUD")

CRUD.app = app
CRUD.modelo = Proceso
CRUD.nombreDeObjetoSingular = "proceso"
CRUD.nombreDeObjetoPlural = "procesos"
CRUD.campoSortDefault = "nombre"
CRUD.camposActualizables = {
  departamento: "",
  nombre: "",
  pasos: "",
  observaciones: "",
  especial: "",
  gastos: "",
  maquinas: "",
  requiereProduccion: ""
}

CRUD.camposDeBusqueda = ["nombre", "observaciones"]

CRUD.crud()

function error(msj, res) {
  return (err) => {
    return RESP._500(res, {
      msj: msj,
      err: err
    })
  }
}

app.post("/buscar_multiple", (req, res) =>
{
  Proceso.find({ _id: { $in: req.body.busqueda } })
    .exec()
    .then((procesos) =>
    {
      return RESP._200(res, null, [{ tipo: "procesos", datos: procesos }])
    })
    .catch(error("Hubo un error buscando los procesos : " + req, res))
})

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app
