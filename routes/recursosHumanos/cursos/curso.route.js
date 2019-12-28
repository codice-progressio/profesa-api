//Esto es necesario
var express = require("express")
var app = express()
var Curso = require("../../../models/recursosHumanos/cursos/curso.model")
const RESP = require("../../../utils/respStatus")

var CRUD = require("../../CRUD")
CRUD.app = app
CRUD.modelo = Curso
CRUD.nombreDeObjetoSingular = "curso"
CRUD.nombreDeObjetoPlural = "cursos"
CRUD.campoSortDefault = "nombre"
CRUD.camposActualizables = {
  nombre: null,
  fechaDeCurso: null,
  duracion: null,
  instructor: null,
  descripcionDeCurso: null,
  esCursoDeTroncoComun: null,
  esCursoDeEspecializacion: null
}

CRUD.camposDeBusqueda = ["nombre", "instructor", "descripcionDeCurso"]

CRUD.crud()

app.get("/tipoDeCurso/troncoComun", (req, res) => {
  Curso.find({ esCursoDeTroncoComun: true })
    .exec()
    .then((cursos) => {
      if (cursos.length < 1)
        throw 'No hay cursos definidos como de "ronco comun"'
        return RESP._200(res, null , [
            { tipo: 'cursos', datos: cursos },
        ]);
        
    })
})

module.exports = app
