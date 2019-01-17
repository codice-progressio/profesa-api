var express = require('express');
var ModeloCompleto = require('../../models/modeloCompleto');
var app = express();
var colores = require('../../utils/colors');

var Modelo = require('../../models/modelo');
var Tamano = require('../../models/tamano');
var Color = require('../../models/colores/color');
var Terminado = require('../../models/terminado');



var RESP = require('../../utils/respStatus');


var CRUD = require('../CRUD');
CRUD.app = app;
CRUD.modelo = ModeloCompleto;
CRUD.nombreDeObjetoSingular = 'tamano';
CRUD.nombreDeObjetoPlural = 'tamanos';
CRUD.campoSortDefault = 'tamano';
CRUD.camposActualizables = {
    medias: null,
    laserAlmacen: null,
    versionModelo: null,
    familiaDeProcesos: null,
    procesosEspeciales: null,
    nombreCompleto: null,
    porcentajeDeMerma: null,
    espesor: null,
};



CRUD.camposDeBusqueda = [
    'tamano',
];

CRUD.crud();




//Esto es necesario
// var express = require('express');
// var app = express();
// var colores = require("../../utils/colors");
// var RESP = require('../../utils/respStatus');
// var Tamano = require('../../models/tamano');

// ============================================
// Obtiene todos los tamaños. 
// ============================================

// app.get('/', (req, res, next) => {
//     const desde = Number(req.query.desde || 0);
//     const limite = Number(req.query.limite || 30);
//     const sort = Number(req.query.sort || 1);
//     const campo = String(req.query.campo || 'tamano');

//     Promise.all([
//             Tamano.find().limit(limite).skip(desde).sort({
//                 [campo]: sort
//             }).exec(),
//             Tamano.countDocuments()
//         ]).then(resp => {
//             return RESP._200(res, null, [
//                 { tipo: 'tamanos', datos: resp[0] },
//                 { tipo: 'total', datos: resp[1] },
//             ]);

//         })
//         .catch(err => {
//             return RESP._500(res, {
//                 msj: 'Hubo un error buscando los tamanos.',
//                 err: err,
//             });
//         });

// });


// // ============================================
// // Modificamos un tamano. 
// // ============================================
// app.put('/', (req, res, next) => {
//     var promise = Tamano.findById(req.body._id).exec();
//     promise.then(tamano => {
//         if (!tamano) {
//             Promise.reject(" No existe");
//             return RESP._400(res, {
//                 msj: 'No existe el tamaño',
//                 err: 'El id que ingresaste no esta en la base de datos.',
//             });
//         }
//         tamano.tamano = req.body.tamano;
//         tamano.estandar = req.body.estandar;
//         return tamano.save();
//     }).then(tamano => {
//         return RESP._200(res, 'Se modifico correctamente el tamaño.', [
//             { tipo: 'tamano', datos: tamano },
//         ]);
//     }).catch(err => {
//         console.log(colores.danger('ERROR') + err);
//         return RESP._500(res, {
//             msj: 'Hubo un erro modificando el tamaño.',
//             err: err,
//         });

//     });

// });

// app.delete('/:id', (req, res, next) => {
//     const id = req.params.id;

//     Tamano.findOneAndRemove({ _id: id }).exec().then(eliminado => {

//             if (!eliminado) {
//                 return RESP._400(res, {
//                     msj: 'No existe el tamano.',
//                     err: 'El id del tamano que ingresaste no esta registrado en la BD.',
//                 });
//             }
//             return RESP._200(res, `Se elimino de manera correcta el tamano ${eliminado.tamano}`, [
//                 { tipo: 'tamano', datos: eliminado },
//             ]);

//         })
//         .catch(err => {
//             return RESP._500(res, {
//                 msj: 'Hubo un error eliminando el tamano.',
//                 err: err,
//             });
//         });
// });



// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;