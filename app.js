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

var RESP = require("./utils/respStatus")

var defaults = require("./config/defaultData")
var _ROUTES = require("./config/routes").ROUTES

var _PERMISOS = require("./middlewares/permisos").PERMISOS

/**
 * Este codigo nos permite agregar datos al htttp 
 * para tenerlos donde sea?
 * 
 */

const httpContext = require("express-http-context");

// ============================================
// ENVIROMENT
// ============================================
//  true = Producción
//  false = Development

var ENVIROMENT = db.enviroment(process.env.NODE_ENV === "production")
// ============================================

// Inicializar variables.
var app = express()

// Esta función nos ayuda a quitar duplicados dentro
//  del array.
Array.prototype.unique = (function(a) {
  return function() {
    return this.filter(a)
  }
})(function(a, b, c) {
  return c.indexOf(a, b + 1) < 0
})

Array.prototype.greaterThan0 = function(a) {
  return a.length >= 1
}

app.use(compression())

app.use(function(req, res, next) {
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
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
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

// // ============================================
// // Rutas - Middleware PARA SISTEMA CARRDUCI
// // ============================================



// Tiene que estar aqui por que segun la documentacion...
// Note that some popular middlewares (such as body-parser, express-jwt) may 
// cause context to get lost. To workaround such issues, you are advised to use 
// any third party middleware that does NOT need the context BEFORE you use 
// this middleware.
app.use(httpContext.middleware);

// Obtenemos el token
app.use((req, res, next) => {
  // const espera = Math.random() * 2 * 5000
  // const espera = 0;
//   console.log(`Esperando ${espera} ms`)
//   setTimeout(function() {
  if (!ENVIROMENT.esModoProduccion)
  {
    console.log(
      `${new Date()}|` +
        colores.success("PETICION RECIVIDA") +
        colores.danger(req.method) +
        colores.info(req.originalUrl)
    )
    
  }

    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      req.token = req.headers.authorization.split(" ")[1]
    } else if (req.query && req.query.token) {
      req.token = req.query.token
    }
    next()
//   }, espera)
})

// NOTA: EL ORDEN ES IMPORTANTE. Primero hay que ejecutar este middleware.
app.use(
  // [_PERMISOS()],
  (req, res, next) => {
    console.log(
      colores.success("SEGURIDAD") + colores.info(req.originalUrl) + "Validado."
    )
    next()
  }
)


// <!-- 
// =====================================
//  CARGAR EL USUARIO LOGUEADO PARA LOS MIDDLEWARE
// =====================================
// -->

var jwt = require("jsonwebtoken")
var SEED = require("./config/config").SEED
app.use((req, res, next) =>
{
  var token = req.token;
  if (token)
  {
    jwt.verify(token, SEED, (err, decode) => {
  
          if (err) {
            next(new Error(err))
            return 
          }
  
          // Colocar la información del usuario en 
          // cualquier petición. Lo extraemos del decode.
        httpContext.set("usuario", decode.usuario );
  
      });
    
  } next()
} )

// <!-- 
// =====================================
//  END CARGAR EL USUARIO LOGUEADO PARA LOS MIDDLEWARE
// =====================================
// -->

// Luego creamos las routes.
for (const key in _ROUTES) {
  if (_ROUTES.hasOwnProperty(key)) {
    const route = _ROUTES[key]
    app.use(route.url, route.route)
  }
}

// Llamamos a los errores.
app.use(function(req, res) {
  return RESP._404(res, {
    msj: "La pagina solicitada no existe.",
    err: "La pagina que solicitaste no existe."
  })
})

app.use(function(err, req, res) {
  return RESP._500(res, {
    msj: "Hubo un error.",
    err: err
  })
})

// ============================================
// NO BORRAR POR QUE PUEDE QUE NOS SIRVA MAS ADELANTE.
// ============================================

// function requireHTTPS(req, res, next) {
//     console.log('Entro a este midleware')
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
        cert: fs.readFileSync("certificado/api.192.168.1.149.crt")
      },
      app
    )
    .listen(ENVIROMENT.port, () => {
      console.log(ENVIROMENT.msj_mongoose_ok)
      defaults()
    })
} else {
  https
    .createServer(
      {
        key: fs.readFileSync("certificado/api.localhost.key"),
        cert: fs.readFileSync("certificado/api.localhost.crt")
      },
      app
    )
    .listen(ENVIROMENT.port, () => {
      console.log(ENVIROMENT.msj_mongoose_ok)
      defaults()
    })
  //     // Escuchar peticiones cuando estamos trabajando en modo desarollo.
  // app.listen(ENVIROMENT.port, () => {
  //     console.log(ENVIROMENT.msj_mongoose_ok);
  //     defaults();
  // });
}
