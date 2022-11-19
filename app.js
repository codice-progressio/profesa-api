require("dotenv").config()
console.log("[ INFO ] Modo:" + process.env.NODE_ENV)
// Mongoose
const mongoose = require("mongoose")
mongoose.set("bufferCommands", false)
// Conexión a la BD
mongoose
  .connect(process.env.URI)
  .then(ok =>
  {
    console.log("[ INFO ] Conectado a la BD")
    // Configuraciones generales express
    const express = require("express")
    const app = express()
    app.use(express.json({ limit: "20mb" }))
    app.use(express.urlencoded({ limit: "20mb", extended: true }))
    app.use(require("compression")())

    // Manejo de imagenes
    // const easyImages = require("@codice-progressio/easy-images")
    // easyImages.config({
    //   GCLOUD_PROJECT_ID: process.env.GCLOUD_PROJECT_ID,
    //   GCLOUD_STORAGE_BUCKET_URL: process.env.GCLOUD_STORAGE_BUCKET_URL,
    //   GCLOUD_APPLICATION_CREDENTIALS:
    //     process.env.GCLOUD_APPLICATION_CREDENTIALS,
    // })

    // Creamos la conexion a express
    const msjServidor = () =>
    {
      console.log(
        `[ INFO ] Servidor iniciado en el puerto: ${ process.env.PORT }`
      )
    }

    // Para modo development necesitamos definir un certificado
    if (process.env.NODE_ENV === "development")
    {
      // Ruta de llave y certificados

      const ssl = {
        key: "./node_modules/@codice-progressio/easy-https/cert/desarrollo.key",
        cert: "./node_modules/@codice-progressio/easy-https/cert/desarrollo.crt",
      }
      // Solo leemos estos datos si estamos en local
      let fs = require("fs")
      const privateKey = fs.readFileSync(ssl.key, "utf8")
      const certificate = fs.readFileSync(ssl.cert, "utf8")
      const credentials = { key: privateKey, cert: certificate }

      require("https")
        .createServer(credentials, app)
        // .listen(process.env.PORT, (msjServidor))
        .listen(process.env.PORT, "0.0.0.0", msjServidor)
    } else
    {
      if (process.env.NUBE === 'true')
        //Despliegue heroku
        app.listen(process.env.PORT, () => msjServidor)
      else
      {
        let fs = require("fs")
        let ssl = {
          key: process.env.KEY,
          cert: process.env.CERT,
        }
        const key = fs.readFileSync(ssl.key, "utf8")
        const cert = fs.readFileSync(ssl.cert, "utf8")
        const credentials = { key, cert }

        require("https")
          .createServer(credentials, app)
          .listen(process.env.PORT, msjServidor)
      }
    }

    if (process.env.NODE_ENV === "development")
      app.use((req, res, next) =>
      {
        const url = require('url')

        const fullUrl = (req) =>
        {
          return url.format({
            protocol: req.protocol,
            host: req.get('host'),
            pathname: req.originalUrl
          })
        }
        console.log(`[ REQUEST ] ${ fullUrl(req) }`)
        next()
      })


    // const { graphqlHTTP } = require('express-graphql')
    // const { schema } = require("./graphql/main.graphql")

    // app.use(
    //   '/graphql',
    //   graphqlHTTP({
    //     schema,
    //     graphiql: true,
    //   })
    // )


    // SEGURIDAD
    let security = require("./app.security")

    // HOOKS
    require("./models/hooks/usuario.hooks.route")(security.schema)
    app.use(security.basico(security.schema))

    //Convierte los valores de los query que se pasan por url
    // en valores. Ej. 'true'=> true, '1000' => 1000
    app.use(require("express-query-auto-parse")())

    // Cargamos todas las rutas
    app.use(require("./config/routes"))
    // MANEJO DE ERRORES
    // Plantilla para la estructura de los errores.
    let errP = error =>
    {
      return { error }
    }
    app.use(function (req, res)
    {
      console.log("No existe la pagina")
      return res.status(404).send(errP("No existe la pagina"))
    })

    app.use(function (error, req, res, next)
    {
      console.error(error)

      let nombreParametroRequest =
        require("@codice-progressio/express-authentication").configuraciones
          .easy_permissions.configuraciones.nombreParametroRequest

      if (error.code === "invalid_token")
      {
        return res
          .status(401)
          .send(errP("Token invalido. Inicia sesion de nuevo"))
      }

      if (error.code === "credentials_required")
      {
        return res.status(401).send(errP("Es necesario loguearte"))
      }

      if (error.errors)
      {
        return res.status(500).send(errP(error.message))
      }

      if (error?.status === 403 && req[nombreParametroRequest])
      {
        let leyenda = "No tienes permiso: " + req[nombreParametroRequest]
        return res.status(401).send(errP(leyenda))
      }
      return res.status(500).send(errP(error))
    })
  })
  .catch(_ => console.log("[ ERROR APLICACION ]:", _))
