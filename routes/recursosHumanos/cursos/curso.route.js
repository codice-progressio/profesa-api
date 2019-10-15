//Esto es necesario
var express = require("express")
var app = express()
var Curso = require("../../../models/recursosHumanos/cursos/curso.model")


var CRUD = require("../CRUD")
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
    cursoDeTroncoComun: null,
    cursoDeEspecializacion: null
}

CRUD.camposDeBusqueda = [
    'nombre',
    'instructor',
    'descripcionDeCurso'
]

CRUD.crud()


module.exports = app
