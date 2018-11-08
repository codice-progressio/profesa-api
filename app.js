// Requires
var express = require('express');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var colores = require('./utils/colors');
var bodyParser = require('body-parser');
var ERR = require('./utils/respStatus');
var db = require('./config/db');

var defaults = require('./config/defaultData');


// ============================================
// ENVIROMENT
// ============================================
//  true = Producción
//  false = Development
var ENVIROMENT = db.enviroment(false);
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
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', "POST, GET, PUT, DELETE, OPTIONS");
    next();
});



//  Body parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//importar rutas.
var appRoutes = require('./routes/app');
var usuarioRoutes = require('./routes/usuario');
var loginRoutes = require('./routes/login');
var hospitalRoutes = require('./routes/hospital');
var medicoRoutes = require('./routes/medico');
var busquedaRoutes = require('./routes/busqueda');
var uploadRoutes = require('./routes/upload');
var imagenesRoutes = require('./routes/imagenes');

// ============================================
// IMPORTAR RUTAS PARA SISTEMA CARRDUCI
// ============================================

var folioRoutes = require('./routes/folio');
var folioLineaRoutes = require('./routes/folioLinea');
var modeloCompletoRoutes = require('./routes/gestionModelos/modeloCompleto');
var clienteRoutes = require('./routes/cliente');
var departamentoRoutes = require('./routes/departamento');
var procesoRoutes = require('./routes/proceso');
var ordenRoutes = require('./routes/orden');
var trayectoriaRoutes = require('./routes/trayectoria');
var maquinaRoutes = require('./routes/maquina');
var gastoRoutes = require('./routes/gasto');

var modeloRoutes = require('./routes/gestionModelos/modelo');
var tamanoRoutes = require('./routes/gestionModelos/tamano');
var colorRoutes = require('./routes/gestionModelos/color');
var terminadoRoutes = require('./routes/gestionModelos/terminado');
var versionModeloRoutes = require('./routes/gestionModelos/versionModelo');
var laserRoutes = require('./routes/gestionModelos/laser');

// ALMACEN
var materialRoutes = require('./routes/almacen/material');


// ============================================
// END IMPORTAR RUTAS PARA SISTEMA CARRDUCI
// ============================================




mongoose.connection.openUri(ENVIROMENT.uri, (err, res) => {
    console.log(ENVIROMENT.msj_bienvenida);
    if (err) {
        console.log(ENVIROMENT.msj_bd_err);
        throw err;
    }
    console.log(ENVIROMENT.msj_bd_ok);
});


// Rutas - Middleware
app.use('/usuario', usuarioRoutes);
app.use('/hospital', hospitalRoutes);
app.use('/medico', medicoRoutes);
app.use('/login', loginRoutes);
app.use('/busqueda', busquedaRoutes);
app.use('/upload', uploadRoutes);
app.use('/img', imagenesRoutes);

// ============================================
// Rutas - Middleware PARA SISTEMA CARRDUCI
// ============================================

app.use('/folio', folioRoutes);
app.use('/folioLinea', folioLineaRoutes);
app.use('/modeloCompleto', modeloCompletoRoutes);
app.use('/cliente', clienteRoutes);
app.use('/departamento', departamentoRoutes);
app.use('/proceso', procesoRoutes);
app.use('/orden', ordenRoutes);
app.use('/trayectoria', trayectoriaRoutes);
app.use('/maquina', maquinaRoutes);
app.use('/gasto', gastoRoutes);

app.use('/modelo', modeloRoutes);
app.use('/tamano', tamanoRoutes);
app.use('/color', colorRoutes);
app.use('/terminado', terminadoRoutes);
app.use('/versionModelo', versionModeloRoutes);
app.use('/laser', laserRoutes);

// Almacen
app.use('/material', materialRoutes);





// ============================================
// END Rutas - Middleware PARA SISTEMA CARRDUCI
// ============================================


//ESta tiene que ser la última ruta. 
app.use('/', appRoutes);

app.use(function(req, res, next) {

    var error = {
        error: 'Error 404',
        mensaje: 'La página solicitada no existe.',
        páginaSolicitada: req.get('host') + req.originalUrl,
        status: 404,
        ok: false
    };

    res.status(404).send(error);
});

app.use(function(err, req, res, next) {
    return res.status(500).json(err);
});

// Escuchar peticiones.
app.listen(ENVIROMENT.port, () => {
    console.log(ENVIROMENT.msj_mongoose_ok);
    defaults();
});