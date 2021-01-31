const { Storage } = require("@google-cloud/storage")
const Sharp = require("sharp")
//El receptor de ficheros
const multer = require("multer")

// Filtro para multer para las extenciones deseadas.
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true)
  } else {
    cb(`La imagen ${file.originalname} no es de tipo jpg/jpeg or png`, false)
  }
}

module.exports.recibirImagen = multer({
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

module.exports.bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET_URL)

module.exports.redimencionarMiddleware = (req, params, next) => {
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
}

exports.modeuls = function eliminarImagenDeBucket(nombre) {
  const file = bucket.file(nombre)
  return file.delete()
}
