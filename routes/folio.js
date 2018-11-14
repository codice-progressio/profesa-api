//Esto es necesario
var express = require('express');
var Folio = require('../models/folios/folio');
var colores = require('../utils/colors');


var app = express();

// ============================================
// Obtener todos los folios existentes. 
// ============================================

app.get('/', (req, res, next) => {

    console.log(colores.info('/folio') + '[get] Funcionando.');
    var desde = req.query.desde || 0;
    desde = Number(desde);

    var sinOrdenes = req.query.sinOrdenes || false;
    var conOrdenes = req.query.conOrdenes || false;
    var limite = +req.query.limite || 5;
    var prioridad = req.query.prioridad;


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
    }

    if (prioridad) {
        filtros.$or = [
            { 'nivelDeUrgencia': prioridad }
        ];

    }




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
                path: 'laserAlmacen modelo tamano color terminado'
            }
        })
        .populate('folioLineas.laserCliente')
        .populate('folioLineas.ordenes.ubicacionActual.departamento')
        .populate('folioLineas.ordenes.siguienteDepartamento.departamento')
        .populate('folioLineas.ordenes.trayectoNormal.departamento')
        // TODO: Quitar comentario. 
        // .populate({
        //     path: 'folioLineas.ordenes.ubicacionActual.departamentoActual',
        //     populate: {
        //         path: 'departamento'
        //     }
        // })
        // .populate({
        //     path: 'folioLineas',
        //     populate: {
        //         path: 'modeloCompleto laserCliente',
        //         populate: {
        //             path: 'laserAlmacen modelo tamano color terminado'
        //         }
        //     }
        // })
        .exec((err, folios) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error cargando folios.',
                    errors: err
                });
            }

            // Contamos los datos totales que hay registrados, 
            // estos sirven para la paginación. 
            Folio.count(filtros, (err, conteo) => {
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Petición realizada correctamente',
                    folios: folios,
                    total: conteo
                });
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
        path: 'folioLineas.modeloCompleto folioLineas.laserCliente ',
        populate: {
            path: 'modelo tamano color terminado laserAlmacen versionModelo familiaDeProcesos procesosEspeciales.proceso',
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
                path: 'modeloCompleto laserCliente',
                populate: {
                    path: 'laserAlmacen modelo tamano color terminado'
                }
            }
        })
        .populate({ path: 'folioLineas.procesos.proceso', populate: { path: 'departamento' } })
        .populate(populate)

    .exec((err, folio) => {
        if (err) {
            console.log(colores.danger('Error get:/id - folio') + 'Error al buscar folio. =>' + err);

            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar folio.',
                errors: err
            });
        }

        //Validamos que haya un folio con ese id.
        if (!folio) {
            console.log(colores.danger('Error get:/id - folio') + `El folio con id ${id} no existe. =>` + err);

            return res.status(400).json({
                ok: false,
                mensaje: `El folio con id ${id} no existe.`,
                errors: { message: 'No existe un folio con ID.' }
            });
        }

        // Contamos los datos totales que hay registrados, 
        // estos sirven para la paginación. 
        return res.status(200).json({
            ok: true,
            mensaje: 'Petición realizada correctamente',
            folio: folio,
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

    folio.save((err, folioGuardado) => {

        if (err) {
            console.log(colores.danger('Error POST - folio') + 'Error al guardar folio. =>' + err);

            return res.status(400).json({
                ok: false,
                mensaje: 'Error al guardar folio.',
                errors: err
            });
        }

        // Ojo que aquí retornamos un documentos. 
        // Todavia no entiendo que significa pero tiene que ser así como
        // lo estoy haciendo. 
        folioGuardado
            .populate('cliente', 'sae nombre')
            .populate('vendedor', 'nombre')
            .execPopulate()
            .then((folioGuardado) => {
                res.status(200).json({
                    ok: true,
                    folio: folioGuardado
                });
            }).catch((err) => {

                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al popular el folio.',
                    errors: err
                });
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



// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;