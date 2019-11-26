//Esto es necesario
var express = require("express")
var app = express()
var Puesto = require("../../../models/recursosHumanos/puestos/puesto.model")
var CONSTANSTES = require("../../../utils/constantes")
var RESP = require("../../../utils/respStatus")
var CRUD = require("../../CRUD")
CRUD.app = app
CRUD.modelo = Puesto
CRUD.nombreDeObjetoSingular = "puesto"
CRUD.nombreDeObjetoPlural = "puestos"
CRUD.campoSortDefault = "puesto"
CRUD.camposActualizables = {
  puesto: null,
  fechaDeCreacionDePuesto: null,
  vigenciaEnAnios: null,
  cursosRequeridos: null,
  departamento: null,
  reportaA: null,
  // organigrama: null,
  misionDelPuesto: null,
  personalACargo: null,
  perfilDelPuesto: null,
  funcionesEspecificasDelPuesto: null,
  relacionClienteProveedor: null,
  indicesDeEfectividad: null,
  elPuestoPuedeDesarrollarseEnLasSiguientesAreas: null,
  quien: null,
  sueldoBase: null,
  sueldoMaximo: null,
  numeroDeExtencion: null,
  motivoDeCambio: null
}

CRUD.camposDeBusqueda = ["puesto"]

CRUD.crud()

app.post("/multiple", (req, res) => {
  Puesto.find({ _id: { $in: req.body } })
    .exec()
    .then((puestos) => {
      return RESP._200(res, null, [{ tipo: "puestos", datos: puestos }])
    })
    .catch((err) => {
      return RESP._500(res, {
        msj: "Error en la busqueda multiple de puestos",
        err: err
      })
    })
})

module.exports = app
