var express = require('express');

// var FolioLinea = require('../models/folioLinea');
var Folio = require('../models/folios/folio');

var RESP = require('../utils/respStatus');

// 


var app = express();

// ============================================
// Actualizar el folio.
// ============================================


app.put('/:idFolio/:idLinea', (req, res) => {
    // Obetenemos el body para extraer de el 
    // los parametros que se envían por POST
    var body = req.body;

    // Obtenemos el id del folio de el que queremos sus lineas. 
    var idFolio = req.params.idFolio;
    var idLinea = req.params.idLinea;

    const busqueda = {
        '_id': idFolio,
        'folioLineas._id': idLinea
    };

    const set = {
        '$set': {
            'folioLineas.$.modeloCompleto': body.modeloCompleto,
            'folioLineas.$.cantidad': body.cantidad,
            'folioLineas.$.nivelDeUrgencia': body.nivelDeUrgencia,
            'folioLineas.$.laserCliente': body.laserCliente,
            'folioLineas.$.almacen': body.almacen,
            'folioLineas.$.updatedAt': new Date().toISOString(),
            'folioLineas.$.procesos': body.procesos,
            'folioLineas.$.coloresTenidos': body.coloresTenidos,
        }
    };

    Folio.findOneAndUpdate(busqueda, set, { new: true }, (err, folioModificado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al popular el folioLinea.',
                errors: err
            });
        }

        if (!folioModificado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe el pedido.',
            });
        }

        folioModificado.calcularNivel(idFolio);

        res.status(200).json({
            ok: true,
            // folioLinea: folioModificado
        });
    });
});

// ============================================
// Agregar nueva linea al folio. 
// ============================================

app.post('/:idFolio', (req, res) => {
    // TODO: Actualziar para promesas. 
    // Obetenemos el body para extraer de el 
    // los parametros que se envían por POST
    var body = req.body;

    // Obtenemos el id del folio de el que queremos sus lineas. 
    var idFolio = req.params.idFolio;

    Folio.findById(idFolio).exec()
        .then(folioExistente => {
            if (!folioExistente) {
                return RESP._400(res, {
                    msj: 'El folio no existe.',
                    err: 'El id que ingresaste no coincide con ningun folio.',

                });
            }

            // Creamos el nuevo objeto y pasamos los datos del req.body
            // al json que queremos manejar. 
            console.log('laserCliente:' + JSON.stringify(body.laserCliente));

            folioExistente.folioLineas.push({
                modeloCompleto: body.modeloCompleto,
                cantidad: body.cantidad,
                nivelDeUrgencia: body.nivelDeUrgencia,
                laserCliente: body.laserCliente,
                almacen: body.almacen ? true : false,
                coloresTenidos: body.coloresTenidos,
                procesos: body.procesos,
            });

            return folioExistente.save();
        })
        .then(folioGrabado => {

            const populate = {
                path: 'folioLineas.modeloCompleto ',
                populate: {
                    path: 'modelo tamano color terminado familiaDeProcesos procesosEspeciales.proceso',
                    populate: {
                        path: 'procesos.proceso departamento',
                        populate: {
                            path: 'departamento'
                        }
                    }
                }
            };

            return folioGrabado
                .populate({ path: 'folioLineas.procesos.proceso', populate: { path: 'departamento' } })
                .populate(populate);



        }).then(folioPopulado => {
            return RESP._200(res, 'Mensaje para interfaz ó null', [
                { tipo: 'folioLinea', datos: folioPopulado.folioLineas.pop() },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error guardando el pedido para el folio.',
                err: err,
            });
        });
});


// ============================================
// END Guardar un folio nuevo.
// ============================================

// ============================================
// Eliminar una linea por el ID
// ============================================
app.delete('/:idFolio/:idLinea', (req, res) => {
    // Obtenemos el id que queremos eliminar.
    var idFolio = req.params.idFolio;
    var idLinea = req.params.idLinea;

    const eliminar = {
        '$pull': {
            folioLineas: { _id: idLinea },
        }
    };

    Folio.findByIdAndUpdate(idFolio, eliminar, (err) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: `Hubo un error eliminando el pedido.`,
                errors: err
            });
        }
        res.status(200).json({
            ok: true,
        });
    });
});
// ============================================
// END Eliminar un folio por el ID
// ============================================


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;