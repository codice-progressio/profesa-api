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
  keyFilename: process.env.GCLOUD_APPLICATION_CREDENTIALS,
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
  (req, res, next) => {
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
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
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
              res.send(sku)
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

        const file = bucket.file(imgDB.nombreBD)

        try {
          await file.delete()
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

  SKU.find({ etiquetas: { $in: etiquetas } })
    .exec()
    .then(skus => res.send(skus))
    .catch(_ => next(_))
})

app.put("/", $("sku:modificar"), (req, res, next) => {
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
        "stockMinimo",
        "stockMaximo",
        "etiqueta",
      ].forEach(x => (sku[x] = req.body[x]))

      return sku.save()
    })
    .then(sku => res.send(sku))
    .catch(err => next(err))
})

app.delete("/:id", $("sku:eliminar"), (req, res) => {
  SKU.findById(req.params.id)
    .exec()
    .then(sku => {
      if (!sku) throw "No existe el sku"

      //Es necesario que eliminimos todas las imagenes.

      return sku.remove()
    })
    .then(sku => res.send(sku))
    .catch(err => erro(res, err, "Hubo un error eliminando el sku"))
})

module.exports = app
