require("dotenv").config()
const easyPermissions = require("@codice-progressio/easy-permissions")
// Generación de permisos

easyPermissions.config({
  modoProduccion: process.env.PRODUCCION === "true",
  generarPermisos: true,
})

const easyImages = require("@codice-progressio/easy-images")

easyImages.config({
  GCLOUD_PROJECT_ID: process.env.GCLOUD_PROJECT_ID,
  GCLOUD_STORAGE_BUCKET_URL: process.env.GCLOUD_STORAGE_BUCKET_URL,
  GCLOUD_APPLICATION_CREDENTIALS: process.env.GCLOUD_APPLICATION_CREDENTIALS,
})

const compression = require("compression")
// Requires
const express = require("express")
const https = require("https")
const fs = require("fs")
const mongoose = require("mongoose")
const colores = require("./utils/colors")
const bodyParser = require("body-parser")
const _ROUTES = require("./config/routes")
const cors = require("cors")

// Inicializar variables.
const app = express()

app.disable("x-powered-by")
app.use(compression())

app.use((req, res, next) => {
  console.log("Entramos 0")
  next()
})
app.use((req, res, next) => {
  console.log("Entramos 0.1")
  next()
})

const corsOptions = {
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
}

console.log(corsOptions)
app.use(cors())

app.use((req, res, next) => {
  console.log("Entramos 1")
  next()
})

//  Body parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.json({ limit: "50mb" }))
app.use((req, res, next) => {
  console.log("Entramos 2")
  next()
})
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }))
app.use((req, res, next) => {
  console.log("Entramos 3")
  next()
})

//Convierte los valores de los query que se pasan por url
// en valores. Ej. 'true'=> true, '1000' => 1000
app.use(require("express-query-auto-parse")())

app.use((req, res, next) => {
  console.log("Entramos 4")
  next()
})

mongoose.set("useNewUrlParser", true)
mongoose.set("useUnifiedTopology", true)
mongoose.set("useCreateIndex", true)
mongoose.connection.openUri(process.env.URI, (err, res) => {
  if (err) {
    // Mensaje de error en la base de datos.
    console.log(err)
    throw err
  }

  app.use((req, res, next) => {
    console.log("Entramos 5")
    next()
  })
  // Mensaje de conexion exitosa a la BD
  console.log("[ INFO ] Conectado a la BD")

  app.use((req, res, next) => {
    if (process.env.PROUDCCION === "false") {
      console.log(
        `${new Date()}|` +
          colores.success("PETICION RECIBIDA") +
          colores.danger(req.method) +
          colores.info(req.originalUrl)
      )
    }
    next()
  })

  app.use((req, res, next) => {
    console.log("Entramos 6")
    next()
  })

  app.use(_ROUTES)

  app.use((req, res, next) => {
    console.log("Entramos 7")
    next()
  })

  // Llamamos a los errores.
  app.use(function (req, res) {
    return res.status(404).send("No existe la pagina")
  })

  app.use((req, res, next) => {
    console.log("Entramos 8")
    next()
  })

  app.use(function (err, req, res, next) {
    console.log(`err`, err)
    //Errores de permisos
    const errores = [
      //Cuando el token no trae un usuario
      "user_object_not_found",
      //No autorizado
      "permission_denied",
    ]

    if (errores.includes(err.code)) {
      return res
        .status(403)
        .send(
          `No tienes permisos para acceder a este contenido: '${req.permisoSolicitado}'`
        )
    }

    if (err.code === "invalid_token") {
      return res.status(401).send("Token invalido. Inicia sesion de nuevo")
    }

    if (err.code === "credentials_required") {
      return res.status(401).send("Es necesario loguearte")
    }

    if (err.errors) {
      return res.status(500).send(err.message)
    }

    return res.status(500).send(err)
  })

  const msjServidor = () => {
    console.log(`Servidor iniciado en el puerto: ${process.env.PORT}`)
  }

  if (process.env.PRODUCCION === "true") {
    console.log("[ INFO ] Modo produccion")
    app.listen(process.env.PORT, msjServidor)
  } else {
    https
      .createServer(
        {
          key: fs.readFileSync(
            "f:/proyectos/geracion-de-certificados/cert/desarrollo.key"
          ),
          cert: fs.readFileSync(
            "f:/proyectos/geracion-de-certificados/cert/desarrollo.crt"
          ),
        },
        app
      )
      .listen(process.env.PORT, msjServidor)
  }
})
