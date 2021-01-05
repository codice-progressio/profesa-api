//Esto es necesario
const express = require("express")

const SKU = require("../../models/sku.model")
const RESP = require("../../utils/respStatus")
const app = express()
const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId
const $ = require("../../config/permisos.config").$
// const fs = require("fs")
const { Storage } = require("@google-cloud/storage")
const Sharp = require("sharp")

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true)
  } else {
    cb(
      new Error(`La imagen ${file.originalname} no es de tipo jpg/jpeg or png`),
      false
    )
  }
}

// const upload = require("multer")({ dest: "uploads/sku/", fileFilter })

const multer = require("multer")
const upload = multer({
  fileFilter,
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, //tamaño < 5 MB
  },
})

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  ...(process.env.PRODUCCION === "false"
    ? { keyFilename: process.env.GCLOUD_APPLICATION_CREDENTIALS }
    : { credentials: JSON.parse(process.env.GCLOUD_APPLICATION_CREDENTIALS) }),
})

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET_URL)

const erro = (res, err, msj) => {
  return RESP._500(res, {
    msj: msj,
    err: err,
  })
}

app.post(
  "/",
  $("sku:crear", undefined, "Crea un nuevo SKU"),
  (req, res, next) => {
    new SKU(req.body)
      .save()
      .then(sku => {
        return res.send(sku)
      })
      .catch(err => next(err))
  }
)

//Agregamos una imagen al sku
app.put(
  "/imagen",
  $("sku:imagen:agregar", undefined, "Agregar una imagen al SKU"),
  upload.single("img"),
  (req, params, next) => {
    // Con este middleware redimiensionamos el tamaño de
    // imagen para que no mida mas de 1000
    Sharp(req.file.buffer)
      // El maximo tamaño horizontal de las imagenes debe ser 1200
      .resize(1200, 1200, { withoutEnlargement: true, fit: Sharp.fit.inside })
      .jpeg({ quality: 80 })
      .toBuffer()
      .then(data => {
        req.file.buffer = data
        return next()
      })
      .catch(err => next(err))
  },
  (req, res, next) => {
    let publicUrl = ""
    SKU.findById(req.body._id)
      .exec()
      .then(sku => {
        if (!sku) throw new Error("No existe el id")
        const nuevoNombre = ObjectId() + ""
        const blob = bucket.file(nuevoNombre)
        const blobStream = blob.createWriteStream({
          metadata: {
            // Important: You need to pass the file mimetype as metadata to createWriteStream() otherwise your file won’t be stored in the proper format and won’t be readable.
            contentType: req.file.mimetype,
          },
        })

        // If there's an error
        blobStream.on("error", err => next(err))

        // If all is good and done
        blobStream.on("finish", () => {
          // Assemble the file public URL
          publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
            bucket.name
          }/o/${encodeURI(blob.name)}?alt=media`
          // Return the file name and its public URL
          // for you to store in your own database

          sku.imagenes.push({
            nombreOriginal: req.file.originalname,
            nombreBD: nuevoNombre,
            path: publicUrl,
          })
          return sku
            .save()
            .then(sku => {
              res.send(sku.imagenes.find(x => x.path === publicUrl))
            })
            .catch(err => next(err))
        })
        blobStream.end(req.file.buffer)
      })
      .catch(_ => {
        // //Si hay un error eliminanos la imagen
        // // que subio multer
        // fs.unlinkSync(req.file.path)
        next(_)
      })
  }
)

//Eliminamos una imagen
app.delete(
  "/imagen/:id/:idImg",
  $("sku:imagen:eliminar", undefined, "Eliminar una imagen del sku"),
  async (req, res, next) => {
    // El id del sku
    let id = req.params.id
    // El id del arreglo donde esta la imagen.
    let idImg = req.params.idImg

    // Buscamos por id
    SKU.findById(id)
      .exec()
      .then(async sku => {
        if (!sku) throw new Error("No existe el id")

        // Obtenemos la img guardada.
        let imgDB = sku.imagenes.id(idImg)
        if (!imgDB) throw new Error("No existe la imagen")

        try {
          await eliminarImagenDeBucket(imgDB.nombreBD)
        } catch (error) {
          throw next(error)
        }
        // // Si la imagen no existe, debemos continuar con la iliminacion
        // // del registro. Por eso comprobamos que existan ambos.
        // if (fs.existsSync(imgDB.path)) fs.unlinkSync(imgDB.path)

        // Pull elimina del arreglo el id que le pasemos relacionado al objeto.
        sku.imagenes.pull(idImg)
        return sku.save()
      })
      .then(sku => res.send(sku))
      .catch(_ => next(_))
  }
)

function eliminarImagenDeBucket(nombre) {
  const file = bucket.file(nombre)
  return file.delete()
}

app.get(
  "/",
  $("sku:leer:todo", undefined, "Muestra los datos generales de los sku"),
  async (req, res, next) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombreCompleto")

    SKU.find()
      .limit(limite)
      .skip(desde)
      .sort({ [campo]: sort })
      .exec()
      .then(sku => res.send(sku))
      .catch(_ => next(_))
  }
)

app.get(
  "/buscar/id/:id",
  $("sku:leer:id", undefined, "Obtiene un sku por su id"),
  (req, res, next) => {
    SKU.findById(req.params.id)
      .exec()
      .then(sku => {
        if (!sku) throw "No existe el id"
        return res.send(sku)
      })
      .catch(_ => next(_))
  }
)

app.get(
  "/buscar/termino/:termino",
  $("sku:leer:termino"),
  async (req, res, next) => {
    const desde = Number(req.query.desde || 0)
    const limite = Number(req.query.limite || 30)
    const sort = Number(req.query.sort || 1)
    const campo = String(req.query.campo || "nombreCompleto")
    const termino = String(
      req.params.termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    const b = campo => ({
      [campo]: { $regex: termino, $options: "i" },
    })

    const $match = {
      $or: [],
    }

    ;["nombreCompleto", "descripcion"].forEach(x => $match.$or.push(b(x)))

    SKU.aggregate([
      { $match },
      { $sort: { [campo]: sort } },
      //Desde aqui limitamos unicamente lo que queremos ver
      { $limit: desde + limite },
      { $skip: desde },
      { $sort: { [campo]: sort } },
      {
        $project: {
          nombreCompleto: "$nombreCompleto",
          descripcion: "$descripcion",
          unidad: "$unidad",
          existencia: "$existencia",
          stockMaximo: "$stockMaximo",
          stockMinimo: "$stockMinimo",
          etiquetas: "$etiquetas",
          imagenes: "$imagenes",
        },
      },
    ])
      .exec()
      .then(sku => res.send(sku))
      .catch(err => next(err))
  }
)

app.get("/buscar/etiquetas", (req, res, next) => {
  let etiquetas = req.query.etiquetas.split(",")

  SKU.find({ etiquetas: { $all: etiquetas } })
    .exec()
    .then(skus => res.send(skus))
    .catch(_ => next(_))
})

app.put(
  "/",
  $("sku:modificar", undefined, "Modificar sku"),
  (req, res, next) => {
    SKU.findById(req.body._id)
      .exec()
      .then(sku => {
        if (!sku)
          throw "No existe el sku"
          // Campos modificables.
        ;[
          "nombreCompleto",
          "unidad",
          "descripcion",
          "puedoProducirlo",
          "puedoComprarlo",
          "puedoVenderlo",
        ].forEach(x => (sku[x] = req.body[x]))

        return sku.save()
      })
      .then(sku => res.send(sku))
      .catch(err => next(err))
  }
)

app.put(
  "/minimo-maximo",
  $(
    "sku:modificar:stock-mimimo-maximo",
    undefined,
    "Modificar el stock minimo y maximo"
  ),
  (req, res, next) => {
    SKU.findById(req.body._id)
      .exec()
      .then(sku => {
        if (!sku)
          throw "No existe el sku"
          // Campos modificables.
        ;["stockMinimo", "stockMaximo"].forEach(x => (sku[x] = req.body[x]))

        return sku.save()
      })
      .then(sku => res.send(sku))
      .catch(err => next(err))
  }
)
app.put(
  "/agregar-etiqueta",
  $("sku:modificar:agregar-etiqueta"),
  (req, res, next) => {
    SKU.findById(req.body._id)
      .exec()
      .then(sku => {
        if (!sku) throw "No existe el sku"
        // Campos modificables.

        sku.etiquetas.push(req.body.etiqueta)

        return sku.save()
      })
      .then(sku => res.send(sku))
      .catch(err => next(err))
  }
)

app.delete("/:id", $("sku:eliminar"), async (req, res, next) => {
  SKU.findById(req.params.id)
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el sku"

      // Elimimanos todas las imagenes.
      let promesas = sku.imagenes.map(x => eliminarImagenDeBucket(x.nombreBD))

      return Promise.all(promesas).then(() => sku.remove())
    })
    .then(sku => res.send(sku))
    .catch(err => next(err))
})

app.delete("/:id/etiqueta/:etiqueta", $("sku:eliminar"), (req, res) => {
  SKU.findById(req.params.id)
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el sku"
      sku.etiquetas.pull(req.params.etiqueta)
      return sku.save()
    })
    .then(sku => res.send(sku))
    .catch(err => erro(res, err, "Hubo un error eliminando el sku"))
})

function recalcularExistencia(sku) {
  // Recalculamos la existencia.
  let existenciaActual = 0
  // Recorremos cada entrada de cada lote para saber
  // Que tipo de movimento es.
  sku.lotes.forEach(lote => {
    lote.existencia = lote.movimientos.reduce(
      (pre, cur) =>
        cur.esEntrada ? (pre += cur.cantidad) : (pre -= cur.cantidad),
      0
    )

    existenciaActual += lote.existencia
  })

  return existenciaActual
}

function recalcularExistenciaPorAlmacenes(sku) {
  // Creamos un nuevo objeto para guardar el calculo de los diferentes
  // almacenes. La clave debe ser el id del almacen seguido de
  // la cantidad.
  // { idAlmacen: 120 }
  sku.lotes.forEach(lote => {
    lote.existenciaAlmacenes = lote.movimientos.reduce((pre, cur) => {
      // Si no existe el id del almacen, lo creamos
      if (!pre.hasOwnProperty(cur.almacen)) pre[cur.almacen] = 0

      // Acumulados directamente al id.
      pre[cur.almacen] = cur.esEntrada
        ? (pre[cur.almacen] += cur.cantidad)
        : (pre[cur.almacen] -= cur.cantidad)

      return pre
    }, {})
  })

  // Sumamos todas las existencias de cada lote por almacen.
  let almacenesSuma = {}
  sku.lotes.forEach(lote => {
    Object.keys(lote.existenciaAlmacenes).forEach(keyIdAlmacen => {
      // Debe de existir el id
      if (!almacenesSuma.hasOwnProperty(keyIdAlmacen))
        almacenesSuma[keyIdAlmacen] = 0
      // Solo necesitamos sumar por que aqui todo deberia ser positivo.
      almacenesSuma[keyIdAlmacen] += lote.existenciaAlmacenes[keyIdAlmacen]
    })
  })

  sku.existenciaAlmacenes = almacenesSuma
}

// Crea un nuevo lote en el sku
app.post(
  "/lote/crear/:id",
  $("sku:lote:crear", undefined, "Crear lotes nuevos"),
  (req, res, next) => {
    SKU.findById(req.params.id)
      .select("lotes")
      .exec()
      .then(sku => {
        if (!sku) throw next("No existe el id")

        //Agregamos el usuario actual

        req.body.movimientos.forEach(x => (x.usuario = req.user._id))
        sku.lotes.push(req.body)
        sku.existencia = recalcularExistencia(sku)
        recalcularExistenciaPorAlmacenes(sku)

        return sku.save()
      })
      .then(sku => res.send(sku))
      .catch(_ => next(_))
  }
)

// Crea un movimento  lote seleccionado
app.put(
  "/lote/movimento/agregar/:id/:idLote/",
  $(
    "sku:lote:movimiento:Agregar",
    undefined,
    "Agregar entradas o salidas a un lote."
  ),
  (req, res, next) => {
    let id = req.params.id
    let idLote = req.params.idLote

    SKU.findById(id)
      .select("lotes")
      .exec()
      .then(sku => {
        if (!sku) throw new Error("No existe el id")
        let lote = sku.lotes.id(idLote)
        if (!lote) throw new Error("No existe el lote")

        req.body.usuario = req.user._id
        lote.movimientos.push(req.body)

        sku.existencia = recalcularExistencia(sku)
        recalcularExistenciaPorAlmacenes(sku)
        return sku.save()
      })
      .then(x => res.send(x))
      .catch(_ => next(_))
  }
)
// Elimina un movimento y recalcula el valor de las existencias.
app.delete(
  "/lote/movimiento/eliminar/:id/:idLote/:idMovimiento",
  $(
    "sku:lote:movimiento:Eliminar",
    undefined,
    "Eliminar movimentos de un lote"
  ),
  (req, res, next) => {
    let id = req.params.id
    let idLote = req.params.idLote
    let idMovimiento = req.params.idMovimiento

    SKU.findById(id)
      .select("lotes")
      .exec()
      .then(sku => {
        if (!sku) throw new Error("No existe el id")
        let lote = sku.lotes.id(idLote)
        if (!lote) throw new Error("No existe el lote")
        let movimiento = lote.movimientos.id(idMovimiento)
        if (!movimiento) throw new Error("No existe el movimiento")

        sku.lotes.id(idLote).movimientos.pull(idMovimiento)

        sku.existencia = recalcularExistencia(sku)
        recalcularExistenciaPorAlmacenes(sku)
        return sku.save()
      })
      .then(x => res.send(x))
      .catch(_ => next(_))
  }
)

app.put(
  "/lote/movimiento/transferir-entre-almacenes/:id/:lote",
  $(
    "sku:lote:movimiento:transferir-entre-almacenes",
    undefined,
    "Hacer transfericias entre dos almacenes."
  ),
  (req, res, next) => {
    let id = req.params.id
    let lote = req.params.lote

    SKU.findById(id)
      .select("lotes")
      .exec()
      .then(sku => {
        if (!sku) throw new Error("No existe el id")
        if (!sku.lotes.id(lote)) throw new Error("No existe el lote")

        // Resibimos un movimiento marcado como salida.

        let salidaAlmacen = req.body.salida
        salidaAlmacen.usuario = req.user._id
        // Siempre debe ser una salida.
        salidaAlmacen.esEntrada = false
        let almacenObjetivo = req.body.almacenObjetivo

        // Creamos el nuevo moviento de entrada al almacen almacenObjetivo

        let entradaAlmacen = {
          cantidad: salidaAlmacen.cantidad,
          // salidaDeAlmacenActual.//,
          esEntrada: true,
          observaciones: "[ TRANSFERENCIA ]" + req.body.observaciones,
          usuario: req.user._id,
          almacen: almacenObjetivo,
        }
        sku.lotes.id(lote).movimientos.push(salidaAlmacen)
        sku.lotes.id(lote).movimientos.push(entradaAlmacen)

        return sku.save()
      })
      .then(sku => res.send(sku))
      .catch(_ => next(_))
  }
)
// Modifica el movimiento seleccinado y recalcula el valor de las existencias.
app.put(
  "/lote/movimiento/modificar/:id/:idLote/:idMovimiento",
  $(
    "sku:lote:movimiento:modificar",
    undefined,
    "Modificar un movimento existente"
  ),
  (req, res, next) => {
    let id = req.params.id
    let idLote = req.params.idLote
    let idMovimiento = req.params.idMovimiento

    SKU.findById(id)
      .select("lotes")
      .exec()
      .then(sku => {
        if (!sku) throw new Error("No existe el id")
        let lote = sku.lotes.id(idLote)
        if (!lote) throw new Error("No existe el lote")
        let movimiento = lote.movimientos.id(idMovimiento)
        if (!movimiento) throw new Error("No existe el movimiento")

        movimiento.cantidad = req.body.cantidad
        movimiento.esEntrada = req.body.esEntrada
        movimiento.observaciones = req.body.observaciones
        movimiento.usuario = req.user._id

        sku.existencia = recalcularExistencia(sku)
        recalcularExistenciaPorAlmacenes(sku)
        return sku.save()
      })
      .then(x => res.send(x))
      .catch(_ => next(_))
  }
)
// Elimina el lote seleccionado y afecta la cantidad total del sku
app.delete(
  "/lote/eliminar/:id/:idLote",
  $("sku:lote:eliminar", undefined, "Eliminar lotes completamente"),
  (req, res, next) => {
    let id = req.params.id
    let idLote = req.params.idLote

    SKU.findById(id)
      .select("lotes")
      .exec()
      .then(sku => {
        if (!sku) throw new Error("No existe el id")
        let lote = sku.lotes.id(idLote)
        if (!lote) throw new Error("No existe el lote")

        sku.lotes.pull(idLote)

        sku.existencia = recalcularExistencia(sku)
        recalcularExistenciaPorAlmacenes(sku)
        return sku.save()
      })
      .then(x => res.send(x))
      .catch(_ => next(_))
  }
)
// Modifica los datos del lote. Ejecuta un recalculo de las existencias
// del sku.
app.put("/lote/modificar/:id/:idLote/", (req, res, next) => {
  let id = req.params.id
  let idLote = req.params.idLote

  SKU.findById(id)
    .select("lotes")
    .exec()
    .then(sku => {
      if (!sku) throw new Error("No existe el id")
      let lote = sku.lotes.id(idLote)
      if (!lote) throw new Error("No existe el lote")

      lote.observaciones = req.body.observaciones
      lote.caducidad = req.body.caducidad

      sku.existencia = recalcularExistencia(sku)
      recalcularExistenciaPorAlmacenes(sku)
      return sku.save()
    })
    .then(x => res.send(x))
    .catch(_ => next(_))
})

module.exports = app
