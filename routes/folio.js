//Esto es necesario
var express = require('express');
var Folio = require('../models/folios/folio');
var colores = require('../utils/colors');
var PERMISOS = require('../middlewares/permisos').PERMISOS;
var _CONST = require('../utils/constantes');
var RESP = require('../utils/respStatus');



var app = express();

// ============================================
// Obtener todos los folios existentes. 
// ============================================

app.get('/', (req, res, next) => {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    const sinOrdenes = req.query.sinOrdenes || false;
    const conOrdenes = req.query.conOrdenes || false;
    const terminados = req.query.terminados || false;
    const limite = +req.query.limite || 5;
    const prioridad = req.query.prioridad;


    var filtros = {};

    if (sinOrdenes) {

        filtros.$or = [
            { 'folioLineas.ordenesGeneradas': false },
            { 'folioLineas': { $size: 0 } }
        ];
    }

    if (conOrdenes) {
        filtros.$or = [
            { 'folioLineas.ordenesGeneradas': true },
        ];

        filtros.$and = [
            { 'terminado': terminados },
            { "folioLineas.0": { "$exists": true } }
        ];
    }

    if (prioridad) {
        filtros.$or = [
            { 'nivelDeUrgencia': prioridad }
        ];
    }



    console.log(`${colores.info('DEBUG FOLIOS TERMINADOS')}  terminados? ${terminados}`);
    console.log(`${colores.info('DEBUG FOLIOS CON ORDENES')}  ORDENES? ${conOrdenes}`);
    console.log(`${colores.info('DEBUG FOLIOS filtros')}  filtros: ${JSON.stringify(filtros)}`);


    Folio.find(filtros)
        .sort({ fechaEntrega: '1' })
        .skip(desde)
        .limit(limite)
        // Es importante que el modelo se importe con 
        // require de otra manera el populate dara error.
        .populate('cliente', 'sae nombre')
        .populate('vendedor', 'nombre')
        .populate({
            path: 'folioLineas.modeloCompleto',
            populate: {
                path: 'modelo tamano color terminado'
            }
        })
        .populate('folioLineas.')
        .populate('folioLineas.ordenes.ubicacionActual.departamento')
        .populate('folioLineas.ordenes.siguienteDepartamento.departamento')
        .populate('folioLineas.ordenes.trayectoNormal.departamento')
        .exec().then(folios => {

            // Contamos los datos totales que hay registrados, 
            // estos sirven para la paginación. 
            Folio.count(filtros, (err, conteo) => {
                return RESP._200(res, null, [
                    { tipo: 'folios', datos: folios },
                    { tipo: 'total', datos: conteo },
                ]);
            });
        }).catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error cargando los folios.',
                err: err,
            });

        });
});


// ============================================
// Actualizar el folio.
// ============================================

// ============================================
// Obtener toda la información de un folio con sus lineas. 
// ============================================

app.get('/:id', (req, res) => {

    var id = req.params.id;
    // Popular
    const populate = {
        path: 'folioLineas.modeloCompleto folioLineas. ',
        populate: {
            path: 'modelo tamano color terminado  familiaDeProcesos procesosEspeciales.proceso',
            populate: {
                path: 'procesos.proceso departamento',
                populate: {
                    path: 'departamento'
                }
            }
        }
    };

    Folio.findById(id)
        // .populate('cliente', 'sae nombre')
        .populate('folioLineas.ordenes.trayectoNormal.departamento')
        .populate({
            path: 'cliente',
            populate: {
                path: 'laserados '

            }
        })
        .populate('vendedor', 'nombre')
        .populate({
            path: 'folioLineas',
            populate: {
                path: 'modeloCompleto ',
                populate: {
                    path: ' modelo tamano color terminado'
                }
            }
        })
        .populate({ path: 'folioLineas.procesos.proceso', populate: { path: 'departamento' } })
        .populate(populate)
        .exec()
        .then(folioEncontrado => {
            if (!folioEncontrado) {
                return RESP._400(res, {
                    msj: 'No existe el folio.',
                    err: 'El id del folio que pasaste no existe en la BD.',
                });
            }

            return RESP._200(res, null, [
                { tipo: 'folio', datos: folioEncontrado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error buscando el folio completo con sus pedidos.',
                err: err,
            });
        });




});
// ============================================
// END Obtener toda la información de un folio con sus lineas. 
// ============================================



// ============================================
// Modificar un folio por su id. 
// ============================================

app.put('/:id', (req, res) => {
    console.log(colores.info('/hospital') + '[put] Funcionando.');
    var id = req.params.id;
    var body = req.body;

    const set = {
        '$set': {
            'numeroDeFolio': body.numeroDeFolio,
            'cliente': body.cliente,
            'fechaFolio': body.fechaFolio,
            'fechaEntrega': body.fechaEntrega,
            'vendedor': body.vendedor,
            'observaciones': body.observaciones
        }
    };

    Folio.findOneAndUpdate({ '_id': id }, set, (err, folioModificado) => {
        if (err) {
            console.log(colores.danger('Error PUT - folio') + 'Error al buscar folio. =>' + err);
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar folio.',
                errors: err
            });
        }
        if (!folioModificado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe el folio.',
            });
        }
        folioModificado.calcularNivel(id);
        res.status(200).json({
            ok: true,
        });
    });

});


// ============================================
// Guardar un folio nuevo.
// ============================================

app.post('/', (req, res, next) => {

    // Obetenemos el body para extraer de el 
    // los parametros que se envían por POST
    var body = req.body;

    // Creamos el nuevo objeto y pasamos los datos del req.body
    // al json que queremos manejar. 

    var folio = new Folio({
        numeroDeFolio: body.numeroDeFolio,
        cliente: body.cliente,
        fechaFolio: body.fechaFolio,
        fechaEntrega: body.fechaEntrega,
        vendedor: body.vendedor,
        observaciones: body.observaciones
    });

    var fol = folio.save();
    fol.then(folioGuardado => {
        return Folio.populate(folioGuardado, { path: 'cliente vendedor' });
    }).then(folioPopulado => {
        return RESP._200(res, 'Se guardo el folio de manera correcta.', [
            { tipo: 'folio', datos: folioPopulado },
        ]);
    }).catch(err => {
        return RESP._500(res, {
            msj: 'Hubo un error guardando el folio.',
            err: err,
        });
    });


});

// ============================================
// END Guardar un folio nuevo.
// ============================================

// ============================================
// Eliminar un folio por el ID
// ============================================
app.delete('/:id', (req, res) => {
    // Obtenemos el id que queremos eliminar.
    var id = req.params.id;

    // Comprobamos que el id ExtensionScriptApis.
    Folio.findByIdAndRemove(id, (err, folioBorrado) => {
        if (err) {
            var msj = 'Error al borrar folio';
            console.log(colores.danger('Error DELETE - Folio') + `${msj} =>` + err);
            return res.status(500).json({
                ok: false,
                mensaje: `${msj}`,
                errors: err
            });
        }

        if (!folioBorrado) {
            var msj2 = 'No existe un folio con ese id.';
            console.log(colores.danger('Error DELETE - Folio') + `${msj2} =>` + err);
            return res.status(400).json({
                ok: false,
                mensaje: msj2,
                errors: { message: msj2 }
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


// ============================================
// Senalar como impreso un folio.
// ============================================

app.post('/ordenesImpresas', (req, res, next) => {
    Folio.findById(req.body._id)
        .then(folioEncontrado => {
            if (!folioEncontrado) {
                return RESP._400(res, {
                    msj: 'No existe el folio.',
                    err: 'El id del folio que ingresaste no existe.',
                });
            }
            folioEncontrado.impreso = true;
            return folioEncontrado.save();
        })
        .then(folioGrabado => {
            return RESP._200(res, null, [
                { tipo: 'folio', datos: folioGrabado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error buscando el folio para senalarlo como impreso',
                err: err,

            });
        });



});


// ============================================
// END Senalar como impreso un folio.
// ============================================


// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;