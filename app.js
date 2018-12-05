// Requires
var express = require('express');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var colores = require('./utils/colors');
var bodyParser = require('body-parser');
var ERR = require('./utils/respStatus');
var db = require('./config/db');

var RESP = require('./utils/respStatus');

var defaults = require('./config/defaultData');
var _ROUTES = require('./config/routes').ROUTES;

var _PERMISOS = require('./middlewares/permisos').PERMISOS;

// ============================================
// ENVIROMENT
// ============================================
//  true = Producción
//  false = Development
var ENVIROMENT = db.enviroment(true);
// ============================================

// Inicializar variables.
var app = express();

// Esta función nos ayuda a quitar duplicados dentro
//  del array. 
Array.prototype.unique = function(a) {
    return function() { return this.filter(a) };
}(function(a, b, c) {
    return c.indexOf(a, b + 1) < 0;
});

Array.prototype.greaterThan0 = function(a) {
    return a.length >= 1;
};

// ============================================
// cors
// ============================================

app.use(function(req, res, next) {

    res.header("Access-Control-Allow-Origin", "http://localhost:4200");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header('Access-Control-Allow-Methods', "POST, GET, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method == "OPTIONS") {
        res.StatusCode = 200;
        return res.status(200).send();
    }
    next();
});



//  Body parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
mongoose.connection.openUri(ENVIROMENT.uri, (err, res) => {
    console.log(ENVIROMENT.msj_bienvenida);
    if (err) {
        console.log(ENVIROMENT.msj_bd_err);
        throw err;
    }
    console.log(ENVIROMENT.msj_bd_ok);
});



// // ============================================
// // Rutas - Middleware PARA SISTEMA CARRDUCI
// // ============================================

// Obtenemos el token
app.use((req, res, next) => {
    console.log(colores.success('PETICION RECIVIDA') + colores.info(req.originalUrl));

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        req.token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        req.token = req.query.token;
    }
    next();
});

// NOTA: EL ORDEN ES IMPORTANTE. Primero hay que ejecutar este middleware.
app.use(
    // [_PERMISOS()],
    (req, res, next) => {
        console.log(colores.success('SEGURIDAD') + colores.info(req.originalUrl) + 'Validado.');
        next();
    });

// Luego creamos las routes.
for (const key in _ROUTES) {
    if (_ROUTES.hasOwnProperty(key)) {
        const route = _ROUTES[key];
        app.use(route.url, route.route)
    }
}

// Llamamos a los errores. 
app.use(function(req, res, next) {
    return RESP._404(res, {
        msj: 'La pagina solicitada no existe.',
        err: 'La pagina que solicitaste no existe.',
    });
});

app.use(function(err, req, res, next) {
    return RESP._500(res, {
        msj: 'Hubo un error.',
        err: err,
    });

});



// Escuchar peticiones.
app.listen(ENVIROMENT.port, () => {
    console.log(ENVIROMENT.msj_mongoose_ok);
    defaults();
});