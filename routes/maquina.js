var express = require("express")
var app = express()
var Maquina = require("../models/maquina")

var RESP = require("../utils/respStatus")

var CRUD = require("./CRUD")
CRUD.app = app
CRUD.modelo = Maquina
CRUD.nombreDeObjetoSingular = "maquina"
CRUD.nombreDeObjetoPlural = "maquinas"
CRUD.campoSortDefault = "clave"
CRUD.camposActualizables = {
    // estandar: null,
}

CRUD.camposDeBusqueda = ["nombre", "clave", "numeroDeSerie", "observaciones"]

CRUD.camposActualizables = {
    nombre: null,
    clave: null,
    anio: null,
    departamentos: null,
    numeroDeSerie: null,
    observaciones: null
}

CRUD.crud()

/**
 * Este controlador obtiene las maquinas por
 * el departamento que se le pase.
 */
app.get("/departamento/:id", (req, res) => {
    /**
     *  El id del departamento que queremos otener sus maquinas.
     */
    const idDepto = req.params.id

    Maquina.find({ departamentos: { $all: { _id: idDepto } } })
        .exec()
        .then((maquinas) => {
            if (maquinas.length === 0) {
                throw "No hay maquinas registradas para este departamento. Para poder continuar es necesario que registres maquinas y se las asignes a este departamento."
            }

            return RESP._200(res, null, [{
                tipo: "maquinas",
                datos: maquinas
            }])
        })
        .catch((err) => {
            return RESP._500(res, {
                msj: "Hubo un error al obtener las maquinas para este departamento.",
                err: err
            })
        })
})

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app