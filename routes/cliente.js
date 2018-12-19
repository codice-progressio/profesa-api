//Esto es necesario
var express = require("express");
var Cliente = require("../models/cliente");
var colores = require("../utils/colors");
var MarcaLaser = require("../models/marcaLaser");
var RESP = require('../utils/respStatus');
var ModeloCompleto = require('../models/modeloCompleto');
var Usuario = require('../models/usuario');

var app = express();

app.get("/", (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Cliente.find({})
        .skip(desde)
        .limit(30)
        .exec().then(clientes => {
            Cliente.countDocuments({}, (err, conteo) => {
                return RESP._200(res, null, [
                    { tipo: 'clientes', datos: clientes },
                    { tipo: 'total', datos: conteo },
                ]);

            });

        }).catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error buscando los clientes.',
                err: err,
            });
        });
});

// ============================================
// Obtiene un cliente por su id.
// ============================================

app.get('/id/:id', (req, res, next) => {
    const id = req.params.id;

    Cliente.findOne({ _id: id })
        .exec()
        .then(clienteEncontrado => {

            if (!clienteEncontrado) {
                return RESP._400(res, {
                    msj: 'No existe el cliente.',
                    err: 'El id que ingresaste no coincide con ninguno en la base de datos.',
                });
            }

            return RESP._200(res, null, [
                { tipo: 'cliente', datos: clienteEncontrado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error buscando al cliente.',
                err: err,
            });
        });
});


// ============================================
// Busca una marca laser del cliente por id de la misma. 
// ============================================
// El id de la marca embebida. 

app.get('/:idLaser', (req, res, next) => {
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


// ============================================
// Guardar un cliente??
// ============================================

app.post("/", (req, res, next) => {

    new Cliente(req.body).save()
        .then(clienteGuardado => {
            return RESP._200(res, 'Se guardo el cliente de manera correcta.', [
                { tipo: 'cliente', datos: clienteGuardado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error guardado en cliente.',
                err: err,
            });
        });
});

// ============================================
// Actualizar cliente
// ============================================

app.put("/:id", (req, res) => {
    console.log(colores.info("/cliente") + "[put] Funcionando.");
    var id = req.params.id;
    var body = req.body;

    Cliente.findById(id).exec()
        .then(clienteEncontrado => {
            if (!clienteEncontrado) {
                return RESP._400(res, {
                    msj: 'No existe el cliente. ',
                    err: 'El id del cliente que pasaste no esta regsitrado.',
                });
            }

            clienteEncontrado.nombre = body.nombre;
            clienteEncontrado.sae = body.sae;
            clienteEncontrado.laserados = body.laserados;
            clienteEncontrado.modelosCompletosAutorizados = body.modelosCompletosAutorizados;

            return clienteEncontrado.save();

        }).then(clienteModificado => {
            return RESP._200(res, 'Se modfico correctamente el cliente.', [
                { tipo: 'cliente', datos: clienteModificado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error modificando al cliente.',
                err: err,
            });
        });

});

// ============================================
// Borrar un cliente
// ============================================

app.delete("/:id", (req, res) => {
    console.log(colores.info("/cliente") + "[delete] Funcionando.");

    var id = req.params.id;

    Cliente.findByIdAndRemove(id, (err, clienteBorrado) => {
        if (err) {
            var msj = "Error al borrar el cliente";
            console.log(colores.danger("Error DELETE - cliente") + `${msj} =>` + err);
            return res.status(500).json({
                ok: false,
                mensaje: `${msj}`,
                errors: err
            });
        }

        if (!clienteBorrado) {
            var msj2 = "No existe un cliente con ese id.";

            console.log(
                colores.danger("Error DELETE - cliente") + `${msj2} =>` + err
            );
            return res.status(400).json({
                ok: false,
                mensaje: msj2,
                errors: { message: msj2 }
            });
        }

        console.log(colores.info("DELETE") + " Petición correcta: clientes");
        res.status(200).json({
            ok: true,
            cliente: clienteBorradop
        });
    });
});

// ============================================
// Agregar una marca laser al cliente.
// ============================================

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