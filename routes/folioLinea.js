var express = require('express');
var colores = require('../utils/colors');

// var FolioLinea = require('../models/folioLinea');
var Folio = require('../models/folios/folio');

var Modelo = require('../models/modelo');
var Tamano = require('../models/tamano');
var Color = require('../models/colores/color');

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

app.post('/:idFolio', (req, res, next) => {

    // Obetenemos el body para extraer de el 
    // los parametros que se envían por POST
    var body = req.body;

    // Obtenemos el id del folio de el que queremos sus lineas. 
    var idFolio = req.params.idFolio;

    Folio.findById(idFolio, (err, folioExistente) => {
        if (!folioExistente) {
            return res.status(400).json({
                ok: true,
                mensaje: 'El folio no existe.',
                errors: err
            });
        }

        // Creamos el nuevo objeto y pasamos los datos del req.body
        // al json que queremos manejar. 

        folioExistente.folioLineas.push({
            modeloCompleto: body.modeloCompleto,
            cantidad: body.cantidad,
            nivelDeUrgencia: body.nivelDeUrgencia,
            laserCliente: body.laserCliente ? body.laserCliente : null,
            almacen: body.almacen ? true : false,
        });

        folioExistente.save((err, folioModificado) => {

            if (err) {
                console.log(colores.danger('Error POST - folioLinea') + 'Error al guardar folioLinea. =>' + err);

                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error de parte del servidor. No se pudo guardar el pedido.',
                    errors: err
                });
            }

            // Popular
            const populate = {
                path: 'folioLineas.modeloCompleto folioLineas.laserCliente',
                populate: {
                    path: 'modelo tamano color terminado laserAlmacen versionModelo'
                }
            };

            Folio.populate(folioModificado, populate, (err, folioCargado) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error de parte del servidor. No se pudo poblar el pedido.',
                        errors: err
                    });
                }

                res.status(200).json({
                    ok: true,
                    folioLinea: folioCargado.folioLineas.pop()
                });
            });
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

    Folio.findByIdAndUpdate(idFolio, eliminar, (err, folioModificado) => {
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