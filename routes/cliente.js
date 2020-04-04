//Esto es necesario
var express = require("express")
var Cliente = require("../models/cliente")
var RESP = require("../utils/respStatus")
var ModeloCompleto = require("../models/modeloCompleto")
var Usuario = require("../models/usuario")

var app = express()

var guard =  require('express-jwt-permissions')()
var permisos = require('../config/permisos.config')

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.post("/", guard.check(permisos.$('cliente:crear')), (req, res) => {
  return new Cliente(req.body)
    .save()
    .then(cliente => {
      return RESP._200(res, "Se guardo el cliente", [
        { tipo: "cliente", datos: cliente }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error guardando el cliente"))
})
app.get("/", guard.check(permisos.$('cliente:leer:todo')), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "nombre")

  const total = await Cliente.countDocuments().exec()

  Cliente.find()
    .sort({ [campo]: sort })
    .limit(limite)
    .skip(desde)
    .exec()
    .then(cliente => {
      return RESP._200(res, null, [
        { tipo: "clientes", datos: cliente },
        { tipo: "total", datos: total }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando los clientes"))
})

app.get("/:id", guard.check(permisos.$('cliente:leer:id')), (req, res) => {
  Cliente.findById(req.params.id)
    .exec()
    .then(cliente => {
      if (!cliente) throw "No existe el id"

      return RESP._200(res, null, [{ tipo: "cliente", datos: cliente }])
    })
    .catch(err => erro(res, err, "Hubo un error buscando el cliente por su id"))
})

app.get("/buscar/:termino", guard.check(permisos.$('cliente:leer:termino')), async (req, res) => {
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

  ;["nombre", "sae"].forEach(x => $match.$or.push(b(x)))

  const total = await Cliente.aggregate([
    { $match },
    { $count: "total" }
  ]).exec()

  Cliente.aggregate([
    { $match },

    //Fin de populacion

    { $sort: { [campo]: sort } },
    //Desde aqui limitamos unicamente lo que queremos ver
    { $limit: desde + limite },
    { $skip: desde },
    { $sort: { [campo]: sort } }
  ])
    .exec()
    .then(clientes => {
      //Si no hay resultados no se crea la propiedad
      // y mas adelante nos da error.
      if (!total.length) total.push({ total: 0 })

      return RESP._200(res, null, [
        { tipo: "clientes", datos: clientes },
        { tipo: "total", datos: total.pop().total }
      ])
    })
    .catch(err =>
      erro(
        res,
        err,
        "Hubo un error buscando los clientes por el termino " + termino
      )
    )
})

app.delete("/:id", guard.check(permisos.$('cliente:eliminar')),(req, res) => {
  Cliente.findById(req.params.id)
    .exec()
    .then(cliente => {
      if (!cliente) throw "No existe el cliente"

      return cliente.remove()
    })
    .then(cliente => {
      return RESP._200(res, "Se elimino de manera correcta", [
        { tipo: "cliente", datos: cliente }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error eliminando el cliente"))
})

app.put("/", guard.check(permisos.$('cliente:modificar')), (req, res) => {
  Cliente.findById(req.body._id)
    .exec()
    .then(cliente => {
      if (!cliente) throw "No existe el cliente"
      
        ;["sae", "nombre", "laserados"].forEach(x => (cliente[x] = req.body[x]))

      return cliente.save()
    })
    .then(cliente => {
      return RESP._200(res, "Se modifico correctamente", [
        { tipo: "cliente", datos: cliente }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error actualizando el cliente"))
})

// ============================================
// Busca una marca laser del cliente por id de la misma.
// ============================================
// El id de la marca embebida.

app.get("/laser/:idLaser", guard.check(permisos.$('cliente:laser:leer:id')), (req, res, next) => {
  const id = req.params.idLaser
  Cliente.findOne({ laserados: { $elemMatch: { _id: id } } })
    .exec()
    .then(clienteEncontrado => {
      if (!clienteEncontrado) {
        return RESP._400(res, {
          msj: "No hubo coincidencias para la marca laser.",
          err: "El id de la marca laser que ingresaste no existe."
        })
      }
      return RESP._200(res, null, [
        { tipo: "marcaLaser", datos: clienteEncontrado.laserados.id(id) }
      ])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error buscando la marca laser.",
        err: err
      })
    })
})

// // ============================================
// // Agregar una marca laser al cliente.
// // ============================================

app.put("/laser/:idCliente", guard.check(permisos.$('cliente:laser:agregar')), (req, res) => {
  var idCliente = req.params.idCliente

  var marcaLaser = req.body.laser

  Cliente.findById(idCliente)
    .exec()
    .then(clienteEncontrado => {
      if (!clienteEncontrado) {
        return RESP._400(res, {
          msj: "El cliente no existe",
          err: "El id que ingresaste no coincide contra ningun cliente."
        })
      }

      clienteEncontrado.laserados.push({
        laser: marcaLaser
      })
      return clienteEncontrado.save()
    })
    .then(clienteGuardado => {
      return RESP._200(res, "Se agrego la marca laser correctamente.", [
        { tipo: "cliente", datos: clienteGuardado }
      ])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error agregando la marca laser al cliente.",
        err: err
      })
    })
})

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app
