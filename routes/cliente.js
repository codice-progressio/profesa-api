//Esto es necesario
var express = require("express");
var Cliente = require("../models/cliente");
var colores = require("../utils/colors");
var MarcaLaser = require("../models/marcaLaser");
var RESP = require('../utils/respStatus');
var ModeloCompleto = require('../models/modeloCompleto');
var Usuario = require('../models/usuario');

var app = express();


var CRUD = require('../routes/CRUD');
CRUD.app = app;
CRUD.modelo = Cliente;
CRUD.nombreDeObjetoSingular = 'cliente';
CRUD.nombreDeObjetoPlural = 'clientes';
CRUD.campoSortDefault = 'nombre';
CRUD.camposActualizables = {
    sae: null,
    nombre: null,
    laserados: null,
    modelosCompletosAutorizados: null,
};



CRUD.camposDeBusqueda = [
    'nombre',
    'sae',
    'laserados.laser',
];

CRUD.crud();


// ============================================
// Busca una marca laser del cliente por id de la misma. 
// ============================================
// El id de la marca embebida. 

app.get('/laser/:idLaser', (req, res, next) => {
    const id = req.params.idLaser;
    Cliente.findOne({ laserados: { $elemMatch: { _id: id } } }).exec()
        .then(clienteEncontrado => {
            if (!clienteEncontrado) {
                return RESP._400(res, {
                    msj: 'No hubo coincidencias para la marca laser.',
                    err: 'El id de la marca laser que ingresaste no existe.',
                });
            }
            return RESP._200(res, null, [
                { tipo: 'marcaLaser', datos: clienteEncontrado.laserados.id(id) },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error buscando la marca laser.',
                err: err,
            });
        });

});

// // ============================================
// // Agregar una marca laser al cliente.
// // ============================================

app.put("/laser/:idCliente", (req, res) => {
    var idCliente = req.params.idCliente;

    var marcaLaser = req.body.laser;

    Cliente.findById(idCliente).exec()
        .then(clienteEncontrado => {
            if (!clienteEncontrado) {
                return RESP._400(res, {
                    msj: 'El cliente no existe',
                    err: 'El id que ingresaste no coincide contra ningun cliente.',
                });
            }

            clienteEncontrado.laserados.push({
                laser: marcaLaser
            });
            return clienteEncontrado.save();
        }).then(clienteGuardado => {
            return RESP._200(res, 'Se agrego la marca laser correctamente.', [
                { tipo: 'cliente', datos: clienteGuardado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error agregando la marca laser al cliente.',
                err: err,
            });
        });


});

// ============================================
// Hace una peticion de agregar un modelo a un cliente. 
// ============================================
app.put("/solicitarAutorizacion/modeloCompleto/:idCliente", (req, res, next) => {
    // Comprobamos que el usuario y el modelo existan
    const idCliente = req.params.idCliente;
    Promise.all([
            ModeloCompleto.findById(req.body.modeloCompleto).exec(),
            Usuario.findById(req.body.usuarioQueSolicitaAutorizacion).exec(),
            Cliente.findById(idCliente).exec()
        ])
        .then(respuestas => {
            const modeloCompleto = respuestas[0];
            const usuario = respuestas[1];
            const cliente = respuestas[2];
            if (!modeloCompleto) {
                return RESP._400(res, {
                    msj: 'No existe el modelo completo.',
                    err: 'El id que ingresaste no existe.',

                });
            }

            if (!usuario) {
                return RESP._400(res, {
                    msj: 'No existe el usuario.',
                    err: 'El id que ingresaste no existe.',
                });
            }

            if (!cliente) {
                return RESP._400(res, {
                    msj: 'El cliente no existe.',
                    err: 'El id que ingresaste no existe.',
                });
            }

            const existe = cliente.modelosCompletosAutorizados.find(x => {
                console.log(x.modeloCompleto.id + '' + modeloCompleto._id.toString())
                return x.modeloCompleto.id === modeloCompleto._id.toString();
            });
            if (existe) {
                return RESP._400(res, {
                    msj: existe.autorizado ? 'Modelo autorizado' : 'Autorizacion pendiente.',
                    err: existe.autorizado ? 'Este modelo ya fue autorizado para este cliente.' : 'La solicitud ya esta echa pero aun no se autoriza.',
                });
            }

            // Modificamos el cliente
            cliente.modelosCompletosAutorizados.push({
                modeloCompleto: modeloCompleto._id,
                usuarioQueSolicitaAutorizacion: usuario._id,
                autorizacionSolicitada: true
            });

            return cliente.save();
        })
        .then(clienteGrabado => {
            return RESP._200(res, 'Se realizo la solicitud para este cliente', [
                { tipo: 'cliente', datos: clienteGrabado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error solicitando la autorizacion.',
                err: err,
            });
        });


});

// ============================================
// END Hace una peticion de agregar un modelo a un cliente. 
// ============================================

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;