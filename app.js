// Variables de ambiente
require("dotenv").config()
// Configuraciones generales express
const express = require("express")
const app = express()

app.use(express.json({ limit: "20mb" }))
app.use(express.urlencoded({ limit: "20mb", extended: true }))
app.use(require("compression")())

// Manejo de imagenes
const easyImages = require("@codice-progressio/easy-images")
easyImages.config({
  GCLOUD_PROJECT_ID: process.env.GCLOUD_PROJECT_ID,
  GCLOUD_STORAGE_BUCKET_URL: process.env.GCLOUD_STORAGE_BUCKET_URL,
  GCLOUD_APPLICATION_CREDENTIALS: process.env.GCLOUD_APPLICATION_CREDENTIALS,
})

// Mongoose
const mongoose = require("mongoose")
mongoose.set("useNewUrlParser", true)
mongoose.set("useUnifiedTopology", true)
mongoose.set("useCreateIndex", true)

//SEGURIDAD --------------------------------------
//Llamamos la libreria.
// const easy_permissions = require("@codice-progressio/easy-permissions")
// easy_permissions.config({
//   modoProduccion: process.env.NODE_ENV === "production",
//   generarPermisos: process.env.NODE_ENV !== "production",
// })
// console.log("entro aqui")

const codice_security = require("@codice-progressio/express-authentication")
console.log("entro aqui")

codice_security.configuraciones.easy_permissions.config({
  modoProduccion: process.env.NODE_ENV === "production",
  generarPermisos: process.env.NODE_ENV !== "production",
  path: require("path").resolve(__dirname).concat("/"),
})

// Definimos el modo debug para este demo
codice_security.configuraciones.debug = process.env.NODE_ENV === "development"
// Usamos la configuracion por defecto de cors, pero
// siempre la podemos sobreescribir.
codice_security.configuraciones.cors.origin = process.env.ORIGIN
//TOKEN
codice_security.configuraciones.jwt.private_key = process.env.PRIVATE_KEY

//  CORREO
codice_security.configuraciones.correo.dominio = process.env.CORREO_DOMINIO
codice_security.configuraciones.correo.dominio_recuperacion =
  process.env.CORREO_DOMINIO_RECUPERACION
codice_security.configuraciones.correo.nombre_aplicacion =
  process.env.CORREO_NOMBRE_APLICACION
codice_security.configuraciones.correo.transport.host =
  process.env.CORREO_TRANSPORT_HOST
codice_security.configuraciones.correo.transport.port =
  process.env.CORREO_TRANSPORT_PORT
codice_security.configuraciones.correo.transport.auth.user =
  process.env.CORREO_TRANSPORT_AUTH_USER
codice_security.configuraciones.correo.transport.auth.pass =
  process.env.CORREO_TRANSPORT_AUTH_PASS

codice_security.configuraciones.correo.mailOptions.from =
  process.env.CORREO_MAILOPTIONS_FROM

console.log(codice_security.configuraciones.jwt)

//Llamamos el metodo basico para que se aplique la configuración de seguridad.
app.use(codice_security.basico())

//Convierte los valores de los query que se pasan por url
// en valores. Ej. 'true'=> true, '1000' => 1000
app.use(require("express-query-auto-parse")())

// Conexión a la BD
mongoose.connection.openUri(process.env.URI, err => {
  if (err) {
    // Mensaje de error en la base de datos.
    console.log(err)
    throw err
  }

  // Mensaje de conexion exitosa a la BD
  console.log("[ INFO ] Modo:" + process.env.NODE_ENV)
  console.log("[ INFO ] Conectado a la BD")
  // Creamos la conexion a express
  const msjServidor = () => {
    console.log(`[ INFO ] Servidor iniciado en el puerto: ${process.env.PORT}`)
  }

  // Para pruebas necesitamos definir un certificado
  if (process.env.NODE_ENV !== "production") {
    // Ruta de llave y certificados
    let ssl = {
      key: process.env.DESARROLLO_KEY,
      cert: process.env.DESARROLLO_CERT,
    }
    // Solo leemos estos datos si estamos en local
    let fs = require("fs")
    const privateKey = fs.readFileSync(ssl.key, "utf8")
    const certificate = fs.readFileSync(ssl.cert, "utf8")
    const credentials = { key: privateKey, cert: certificate }

    require("https")
      .createServer(credentials, app)
      .listen(process.env.PORT, msjServidor)
  }
  // En modo produccion no ocupamos certificado
  else app.listen(process.env.PORT, () => msjServidor)

  // Cargamos todas las rutas
  app.use(require("./config/routes"))

  // MANEJO DE ERRORES
  app.use(function (req, res) {
    console.log("No existe la pagina")
    return res.status(404).send("No existe la pagina")
  })
  app.use(function (err, req, res) {
    console.log(`err`, err)
    //Errores de permisos
    const errores = [
      //Cuando el token no trae un usuario
      "user_object_not_found",
      //No autorizado
      "permission_denied",
    ]

    // Plantilla para la estructura de los errores.
    err = error => {
      error
    }

    if (errores.includes(err.code)) {
      return res
        .status(403)
        .send(
          err(
            `No tienes permisos para acceder a este contenido: '${req.permisoSolicitado}'`
          )
        )
    }

    if (err.code === "invalid_token") {
      return res.status(401).send(err("Token invalido. Inicia sesion de nuevo"))
    }

    if (err.code === "credentials_required") {
      return res.status(401).send(err("Es necesario loguearte"))
    }

    if (err.errors) {
      return res.status(500).send(err(err.message))
    }

    return res.status(500).send(err(err))
  })
})
