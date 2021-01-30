//Esto es necesario
var express = require("express")
var app = express()
var Curso = require("../../../models/recursosHumanos/cursos/curso.model")
const RESP = require("../../../utils/respStatus")

var guard =  require('express-jwt-permissions')()
const $ = require('@codice-progressio/easy-permissions').$

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.post("/", $('curso:crear'), (req, res) => {
  return new Curso(req.body)
    .save()
    .then(curso => {
      return RESP._200(res, "Se guardo el curso", [
        { tipo: "curso", datos: curso }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error guardo el curso"))
})

app.get("/", $('curso:leer:todo'), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")

  const total = await Curso.countDocuments().exec()

  Curso.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(cursos => {
      return RESP._200(res, null, [
        { tipo: "cursos", datos: cursos },
        { tipo: "total", datos: total }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando las cursos"))
})

app.get("/:id", $('curso:leer:id'), (req, res) => {
  Curso.findById(req.params.id)
    .exec()
    .then(curso => {
      if (!curso) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "curso", datos: curso }])
    })
    .catch(err => erro(res, err, "Hubo un error buscando el curso por su id"))
})

app.get("/buscar/:termino", $('curso:leer:termino'), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")
  const termino = String(
    req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  )
  const b = campo => ({
    [campo]: { $regex: termino, $options: "i" }
  })

  const $match = {
    $or: []
  }

  ;["nombre", "instructor", "descripcionDeCurso"].forEach(x =>
    $match.$or.push(b(x))
  )

  const total = await Curso.aggregate([{ $match }, { $count: "total" }]).exec()

  Curso.aggregate([
    { $match },

    //Fin de populacion

    { $sort: { [campo]: sort } },
    //Desde aqui limitamos unicamente lo que queremos ver
    { $limit: desde + limite },
    { $skip: desde },
    { $sort: { [campo]: sort } }
  ])
    .exec()
    .then(cursos => {
      //Si no hay resultados no se crea la propiedad
      // y mas adelante nos da error.
      if (!total.length) total.push({ total: 0 })

      return RESP._200(res, null, [
        { tipo: "cursos", datos: cursos },
        { tipo: "total", datos: total.pop().total }
      ])
    })
    .catch(err =>
      erro(
        res,
        err,
        "Hubo un error buscando los cursos por el termino " + termino
      )
    )
})

app.put("/", $('curso:modificar'), (req, res) => {
  Curso.findById(req.body._id)
    .exec()
    .then(curso => {
      if (!curso) {
        throw "No existe el curso"
      }

      ;[
        "nombre",
        "fechaDeCurso",
        "duracion",
        "instructor",
        "descripcionDeCurso",
        "esCursoDeTroncoComun",
        "esCursoDeEspecializacion"
      ].forEach(x => {
        curso[x] = req.body[x]
      })

      return curso.save()
    })
    .then(curso => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "curso", datos: curso }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error actualizando el curso"))
})


app.delete("/:id", $('curso:eliminar'),(req, res) => {
  Curso.findById(req.params.id)
    .exec()
    .then(curso => {
      if (!curso) throw "No existe el curso"

      return curso.remove()
    })
    .then(curso => {
      return RESP._200(res, "Se elimino de manera correcta", [
        { tipo: "curso", datos: curso }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando el curso"))
})

app.get("/tipoDeCurso/troncoComun", $('curso:leer:tipoDeCurso:troncoComun'), (req, res) => {
  Curso.find({ esCursoDeTroncoComun: true })
    .exec()
    .then(cursos => {
      if (cursos.length < 1)
        throw 'No hay cursos definidos como de "ronco comun"'
      return RESP._200(res, null, [{ tipo: "cursos", datos: cursos }])
    })
})

module.exports = app
