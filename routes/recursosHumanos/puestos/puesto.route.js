//Esto es necesario
var express = require("express")
var app = express()
var Puesto = require("../../../models/recursosHumanos/puestos/puesto.model")
var CONSTANSTES = require("../../../utils/constantes")
var RESP = require("../../../utils/respStatus")
var parsearBody = require("../../../utils/parsearBody")
const ObjectId = require("mongoose").Types.ObjectId
const fs = require("fs")
const fileUpload = require("express-fileupload")
const populacionManual = require("./puesto.route.aggregate")

const $ =  require('@codice-progressio/easy-permissions').$

app.use(fileUpload())

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err
  })
}

app.get("/", $('puesto:leer:todo'),(req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "puesto")

  Promise.all([
    //Esta seccion de aqui aplica para todo los datos
    // de manera que el total tiene que aplicar para
    // contar todos los datos. 
    Puesto.countDocuments().exec(),
    Puesto.aggregate(
      [
        //Este match busca todo lo existente.
        { $match: { inexistenteCampo: { $exists: false } } },
        //Lo tenemos que ordenar primero por que si no va a ser un purrum
        // la paginacion.
        { $sort: { [campo]: sort } },
        //Desde aqui limitamos unicamente lo que queremos ver
        { $limit: desde + limite },
        { $skip: desde }
      ]
        //Hacemos lo que tenemos que hacer.
        .concat(populacionManual())
        //Ordenamos de nuevo por que perdemos el orden con los
        //stages anteriores.
        .concat([{ $sort: { [campo]: sort } }])
    ).exec()
  ])
    .then(respuesta => {
      const total = respuesta[0]
      const puestos = respuesta[1]

      return RESP._200(res, null, [
        { tipo: "puestos", datos: puestos },
        { tipo: "total", datos: total }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando los puestos"))
})

app.get("/:id", $('puesto:leer:id'), (req, res) => {
  Puesto.aggregate(
    [
      {
        $match: { _id: ObjectId(req.params.id) }
      }
    ].concat(populacionManual())
  )
    .exec()
    .then(puesto => {
      puesto = puesto.pop()
      if (!puesto) throw "No existe el puesto"
      return RESP._200(res, null, [{ tipo: "puesto", datos: puesto }])
    })
    .catch(err => erro(res, err, "Hubo un error buscando el id del puesto"))
})

app.get("/buscar/:termino", $('puesto:leer:termino'), async (req, res) => {
  const desde = Number(req.query.desde || 0)
  const limite = Number(req.query.limite || 30)
  const sort = Number(req.query.sort || 1)
  const campo = String(req.query.campo || "puesto")
  const termino = String(
    req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  )

  const $match = {
    $or: [
      {
        puesto: { $regex: termino, $options: "i" }
      },
      {
        misionDelPuesto: { $regex: termino, $options: "i" }
      }
    ]
  }

  const total = await Puesto.aggregate([{ $match }, { $count: "total" }]).exec()
  Puesto.aggregate(
    [
      { $match },
      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde }
    ]
      //Hacemos lo que tenemos que hacer.
      .concat(populacionManual())
      //Ordenamos de nuevo por que perdemos el orden con los
      //stages anteriores.
      .concat([{ $sort: { [campo]: sort } }])
  )
    .exec()
    .then(puestos =>
    {
      
      
      return RESP._200(res, null, [
        { tipo: "puestos", datos: puestos },
        { tipo: "total", datos: total.pop().total }
      ])
    })
    .catch(err => erro(res, err, "Hubo un error buscando los puestos"))
})
/**
 *Desde el gui estamos mandando un form data y este no puede 
 llevar arrays. Para solucionar este problema lo que estamos
 haciendo es que mandamos todos los arreglos como texto con 
 JSON.stringfi. Cuando llegan a la api antes de procesarlos 
 hay que hacer la operacion inversa, solo que no podemos hacer
 esta operacion en campos que no tengan una estructura valida. 
 Es por eso que necesitamos esta funcion que discrimina los
 campos que pueden ser parseados de los que no. 
 *
 * @param {*} body El body stringifiado. 
 * @returns
 */

app.post("/", $('puesto:crear'), (req, res) => {
  const puesto = new Puesto(parsearBody(req.body))

  const organigramaFile = req.files ? req.files.organigrama : null
  if (!organigramaFile) {
    return RESP._500(res, {
      msj: "Es necesario definir un organigrama",
      err: "Al parecer no adjuntaste ninguna imagen"
    })
  }

  validarImagen(organigramaFile, res)

  puesto
    .save()
    .then(puesto => {
      //Movemos la imagen previamente validada ()

      if (!organigramaFile) throw "Es necesario definir el organigrama"

      puesto.organigrama = cargarOrganigrama(organigramaFile, puesto._id)
      return puesto.save()
    })
    .then(puesto => {
      return RESP._200(res, "Se guardo el puesto de manera exitosa", [
        { tipo: "puesto", datos: puesto }
      ])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error guardando el puesto",
        err: err
      })
    })
})

app.put("/", $('puesto:modificar'),(req, res) => {
  const puesto = parsearBody(req.body)
  const organigramaFile = req.files ? req.files.organigrama : null

  if (organigramaFile) validarImagen(organigramaFile, res)

  Puesto.findById(puesto._id)
    .then(p => {
      if (!p) throw "No existe el id"

      // Si se mando imagen entonces la subimos

      puesto.organigrama = organigramaFile
        ? cargarOrganigrama(organigramaFile, puesto._id)
        : p.organigrama

      // Asiganmos el puesto
      Object.assign(p, puesto)
      return p.save()
    })
    .then(puestoG => {
      return RESP._200(res, "Se modifico el puesto de manera correcta", [
        { tipo: "puesto", datos: puestoG }
      ])
    })

    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error modificando el puesto.",
        err: err
      })
    })
})

function validarImagen(organigramaFile, res) {
  const validar = require("../../../utils/extencionesFicherosValidas.utils")
  if (
    !validar.extencionPermitida(organigramaFile) ||
    !validar.esImagen(organigramaFile)
  ) {
    return RESP._500(res, {
      msj: "Formato de imagen no valido",
      err: "No se aceptan este tipo de imagenes"
    })
  }
}

function cargarOrganigrama(organigramaFile, id, nombreAnterior = "") {
  const split = organigramaFile.name.split(".")
  const extencion = split[split.length - 1]
  const path = "./uploads/organigramaPuesto"
  if (!fs.existsSync(path)) fs.mkdirSync(path)

  const nombre = `${id}.${extencion}`
  const pathAnterior = `${path}/${nombreAnterior}`
  const pathNuevo = `${path}/${nombre}`

  if (fs.existsSync(pathAnterior) && fs.lstatSync(pathAnterior).isFile()) {
    fs.unlinkSync(pathAnterior)
  }

  if (!fs.existsSync(path)) fs.mkdirSync(path)
  organigramaFile.mv(pathNuevo, (path, err) => {
    if (err) throw new Error("No se pudo guardar la imagen del organigrama")
  })

  return nombre
}

app.post("/multiple", $('XXXXX:multiplePuesto'), (req, res) => {
  Puesto.find({ _id: { $in: req.body } })
    .exec()
    .then(puestos => {
      return RESP._200(res, null, [{ tipo: "puestos", datos: puestos }])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Error en la busqueda multiple de puestos",
        err: err
      })
    })
})

app.delete("/:id", $('puesto:eliminar'),(req, res) => {
  Puesto.findById(req.params.id)
    .exec()
    .then(resp => {
      if (!resp) throw "No existe el id"
      return resp.remove()
    })
    .then(resp => {
      return RESP._200(res, "Se elimino de manera correcta el puesto", [
        { tipo: "puesto", datos: resp }
      ])
    })
    .catch(err => {
      return RESP._500(res, {
        msj: "Hubo un error al eliminar el puesto",
        err: err
      })
    })
})

module.exports = app
