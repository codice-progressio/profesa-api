var express = require('express');
var app = express();
var Terminado = require('../../models/terminado');
var RESP = require("../../utils/respStatus")


const erro = (res, err, msj) => {
    return RESP._500(res, {
      msj: msj,
      err: err
    })
  }
  
  app.post("/", (req, res) => {
    return new Terminado(req.body)
      .save()
      .then(terminado => {
        return RESP._200(res, "Se guardo el terminado", [
          { tipo: "terminado", datos: terminado }
        ])
      })
      .catch(err => erro(res, err, "Hubo un error guardando el terminado"))
  })
  
  app.get("/", async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "terminado")
  
    const total = await Terminado.countDocuments().exec()
  
    Terminado.find()
      .sort({ [campo]: sort })
      .limit(limite)
      .skip(desde)
      .exec()
      .then(terminados => {
        return RESP._200(res, null, [
          { tipo: "terminados", datos: terminados },
          { tipo: "total", datos: total }
        ])
      })
      .catch(err => erro(res, err, "Hubo un error buscando los terminados"))
  })
  
  app.get("/:id", (req, res) => {
    Terminado.findById(req.params.id)
      .exec()
      .then(terminado => {
        if (!terminado) throw "No existe el id"
  
        return RESP._200(res, null, [{ tipo: "terminado", datos: terminado }])
      })
      .catch(err => erro(res, err, "Hubo un error buscando el terminado por su id"))
  })
  
  app.get("/buscar/:termino", async (req, res) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "terminado")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" }
    })
  
    const $match = {
      $or: []
    }
  
    ;["terminado"].forEach(x => $match.$or.push(b(x)))
  
    const total = await Terminado.aggregate([{ $match }, { $count: "total" }]).exec()
  
    Terminado.aggregate([
      { $match },
  
      //Fin de populacion
  
      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } }
    ])
      .exec()
      .then(terminados => {
        //Si no hay resultados no se crea la propiedad
        // y mas adelante nos da error.
        if (!total.length) total.push({ total: 0 })
  
        return RESP._200(res, null, [
          { tipo: "terminados", datos: terminados },
          { tipo: "total", datos: total.pop().total }
        ])
      })
      .catch(err =>
        erro(
          res,
          err,
          "Hubo un error buscando los terminados por el termino " + termino
        )
      )
  })
  
  app.delete("/:id", (req, res) => {
    Terminado.findById(req.params.id)
      .exec()
      .then(terminado => {
        if (!terminado) throw "No existe el terminado"
  
        return terminado.remove()
      })
      .then(terminado => {
        return RESP._200(res, "Se elimino de manera correcta", [
          { tipo: "terminado", datos: terminado }
        ])
      })
      .catch(err => erro(res, err, "Hubo un error eliminando el terminado"))
  })
  
  app.put("/", (req, res) => {
    Terminado.findById(req.body._id)
      .exec()
      .then(terminado => {
        if (!terminado) throw "No existe el terminado"
        ;["terminado"].forEach(x => (terminado[x] = req.body[x]))
  
        return terminado.save()
      })
      .then(terminado => {
        return RESP._200(res, "Se modifico correctamente", [
          { tipo: "terminado", datos: terminado }
        ])
      })
      .catch(err => erro(res, err, "Hubo un error actualizando el terminado"))
  })

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;