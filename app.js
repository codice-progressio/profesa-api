var compression = require("compression")
// Requires
var express = require("express")

var https = require("https")
var fs = require("fs")

var mongoose = require("mongoose")
mongoose.Promise = global.Promise
var colores = require("./utils/colors")
var bodyParser = require("body-parser")
var db = require("./config/db")
var cors = require("cors")

var RESP = require("./utils/respStatus")

var _ROUTES = require("./config/routes").ROUTES

/**
 * Este codigo nos permite agregar datos al htttp
 * para tenerlos donde sea?
 *
 */

// ============================================
// ENVIROMENT
// ============================================
//  true = Producción
//  false = Development

var ENVIROMENT = db.enviroment(process.env.NODE_ENV === "production")
// ============================================

// Inicializar variables.
var app = express()

app.use(cors())

app.disable("x-powered-by")

// Esta función nos ayuda a quitar duplicados dentro
//  del array.
Array.prototype.unique = (function (a) {
  return function () {
    return this.filter(a)
  }
})(function (a, b, c) {
  return c.indexOf(a, b + 1) < 0
})

Array.prototype.greaterThan0 = function (a) {
  return a.length >= 1
}

app.use(compression())

app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Origin",
    ENVIROMENT.ACCESS_CONTROL_ALLOW_ORIGIN
  )
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  )
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Credentials", "true")

  if (req.method == "OPTIONS") {
    res.StatusCode = 200
    return res.status(200).send()
  }
  next()
})

//  Body parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.json({ limit: "50mb" }))
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }))

//Convierte los valores de los query que se pasan por url
// en valores. Ej. 'true'=> true, '1000' => 1000
app.use(require("express-query-auto-parse")())

mongoose.set("useNewUrlParser", true)
mongoose.set("useUnifiedTopology", true)
mongoose.set("useCreateIndex", true)
mongoose.connection.openUri(ENVIROMENT.uri, (err, res) => {
  // Mensaje de conexion a la base de datos.
  console.log(ENVIROMENT.msj_bienvenida)
  if (err) {
    // Mensaje de error en la base de datos.
    console.log(ENVIROMENT.msj_bd_err)
    throw err
  }
  // Mensaje de conexion exitosa a la BD
  console.log(ENVIROMENT.msj_bd_ok)
})

app.use((req, res, next) => {
  if (!ENVIROMENT.esModoProduccion) {
    console.log(
      `${new Date()}|` +
        colores.success("PETICION RECIBIDA") +
        colores.danger(req.method) +
        colores.info(req.originalUrl)
    )
  }

  next()
})

_ROUTES(app)

// Llamamos a los errores.
app.use(function (req, res) {
  return RESP._404(res, {
    msj: "La pagina solicitada no existe.",
    err: "La pagina que solicitaste no existe.",
  })
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

  return RESP._500(res, {
    msj: "Hubo un error.",
    err: err,
  })
})

// ============================================
// NO BORRAR POR QUE PUEDE QUE NOS SIRVA MAS ADELANTE.
// ============================================

// function requireHTTPS(req, res, next) {

//         // The 'x-forwarded-proto' check is for Heroku
// //     if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
// //         return res.redirect('https://' + req.get('host') + req.url);
// //     }
// //     next();
// // }

// app.use(requireHTTPS);

if (ENVIROMENT.esModoProduccion) {
  https
    .createServer(
      {
        key: fs.readFileSync("certificado/api.192.168.1.149.key"),
        cert: fs.readFileSync("certificado/api.192.168.1.149.crt"),
      },
      app
    )
    .listen(ENVIROMENT.port, () => {
      console.log(ENVIROMENT.msj_mongoose_ok)
    })
} else {
  https
    .createServer(
      {
        key: fs.readFileSync("certificado/desarrollo.key"),
        cert: fs.readFileSync("certificado/desarrollo.crt"),
      },
      app
    )
    .listen(ENVIROMENT.port, () => {
      console.log(ENVIROMENT.msj_mongoose_ok)
    })
}
