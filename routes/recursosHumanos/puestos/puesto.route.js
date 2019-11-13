//Esto es necesario
var express = require("express")
var app = express()
var Puesto = require("../../../models/recursosHumanos/puestos/puesto.model")

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
  motivoDeCambio: null,
}

CRUD.camposDeBusqueda = ["puesto"]

CRUD.crud()

module.exports = app
