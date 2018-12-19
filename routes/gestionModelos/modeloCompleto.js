//Esto es necesario
var express = require('express');
var colores = require('../../utils/colors');


var Modelo = require('../../models/modelo');
var Tamano = require('../../models/tamano');
var Color = require('../../models/colores/color');
var Terminado = require('../../models/terminado');

var ModeloCompleto = require('../../models/modeloCompleto');
var RESP = require('../../utils/respStatus');

var app = express();

// ============================================
// Obtenmos todos los modelos. 
// ============================================

app.get('/', (req, res, next) => {
    console.log(colores.info('/modeloCompleto') + '[get] Funcionando.');
    var desde = req.query.desde || 0;
    desde = Number(desde);
    limite = Number(req.query.limite | 20);

    ModeloCompleto.find({})
        .skip(desde)
        .limit(20)
        // .populate('modelo')
        // .populate('tamano')
        // .populate('color')
        // .populate('terminado')
        .exec((err, modelosCompletos) => {
            if (err) {
                return RESP._500(res, {
                    msj: 'Error cargando los modelos completos.',
                    err: err,
                });
            }

            // Contamos los datos totales que hay registrados, 
            // estos sirven para la paginación. 
            ModeloCompleto.count({}, (err, conteo) => {

                return RESP._200(res, null, [
                    { tipo: 'modelosCompletos', datos: modelosCompletos },
                    { tipo: 'total', conteo },
                ]);

            });
        });
});
// ============================================
// FIN Obtenmos todos los modelos. 
// ============================================

// ============================================
// Obtenmos todos los modelos completos
// ============================================

app.get('/costos', (req, res, next) => {
    console.log(colores.info('/modeloCompleto') + '[get] Funcionando.');
    const desde = Number(req.query.desde) || 0;
    const limite = Number(req.query.limite) || 30;

    var mc;

    ModeloCompleto.find({})
        .skip(desde)
        .limit(limite)
        .exec()
        .then(modelosCompletos => {
            mc = modelosCompletos;

            // Contamos los datos totales que hay registrados, 
            // estos sirven para la paginación. 
            return ModeloCompleto.countDocuments();
        })
        .then(mcContado => {
            return RESP._200(res, null, [
                { tipo: 'modelosCompletos', datos: mc },
                { tipo: 'total', datos: mcContado },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error buscando los modelos completos con costo.',
                err: err,
            });
        });

});
// ============================================
// FIN Obtenmos todos los modelos. 
// ============================================

// ============================================
// Buscamos un modelo completo.l
// ============================================

app.get('/buscar/:termino', (req, res, next) => {
    var termino = req.params.termino;
    var desde = Number(req.query.desde || 0);
    var limite = Number(req.query.limite || 30);

    var terminosSeparados = termino.search('-') ? termino.split('-') : [termino];
    console.log(`${colores.info('no funka')}  terminos ${JSON.stringify(terminosSeparados)}`);
    // Separamos los terminos de busqueda
    // Creamos el regex

    // Buscamos las coincidencias para cada promesa. El orden es el siguiemnte
    //                [0] MOD
    //                [1] TAM
    //                [2] COL
    //                [3] TER

    const promesas = [];
    const schemas = [
        [Modelo, 'modelo'],
        [Tamano, 'tamano'],
        [Color, 'color'],
        [Terminado, 'terminado']
    ];

    for (let i = 0; i < terminosSeparados.length; i++) {
        const termino = terminosSeparados[i];
        const campo = schemas[i][1];
        console.log(` El campmo ${campo} y el regex: ${termino}`);
        const s = schemas[i][0].find({
            [campo]: new RegExp(termino, 'i')
        }).exec();
        promesas.push(s);
    }

    const objetoParaFind = {};
    let conteoTotal = {};


    // Ejecutamos las promesas.
    Promise.all(promesas)
        .then(resp => {

            // Obtenemos el id de cada objecto
            let arregloDeObjetos = [];

            arregloDeObjetos = resp.map(a => {
                const na = a.map(id => {
                    return id._id;
                });
                return { $in: na };
            });

            // Generamos el objeto de busqueda con el valor de
            // cada campo.
            for (let i = 0; i < arregloDeObjetos.length; i++) {
                const arr = arregloDeObjetos[i];
                objetoParaFind[schemas[i][1]] = arr;
            }

            return ModeloCompleto.find(objetoParaFind).countDocuments();
        }).then(conteo => {
            conteoTotal = conteo;
            return ModeloCompleto.find(objetoParaFind).skip(desde).limit(limite).exec();
        }).then(mcCoincidencias => {
            return RESP._200(res, null, [
                { tipo: 'modelosCompletos', datos: mcCoincidencias },
                { tipo: 'total', datos: conteoTotal },
            ]);
        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error buscando el modelo completo.',
                err: err,
            });
        });
});




// ============================================
// Guardamos un nuevo modelo.
// ============================================

app.post('/', (req, res, next) => {
    // Obetenemos el body para extraer de el 
    // los parametros que se envían por POST
    var body = req.body;

    // Creamos el nuevo objeto y pasamos los datos del req.body
    // al json que queremos manejar.


    var paraBusqueda = {
        modelo: String(body.modelo).toUpperCase(),
        tamano: String(body.tamano).toUpperCase(),
        color: String(body.color).toUpperCase(),
        terminado: String(body.terminado).toUpperCase(),
        laserAlmacen: String(body.laserAlmacen).toUpperCase(),
        versionModelo: String(body.versionModelo)
    };

    Promise.all([

        guardarModelo(paraBusqueda),
        guardarTamano(paraBusqueda),
        guardarColor(paraBusqueda),
        guardarTerminado(paraBusqueda),


        // Este map permite que se ejecuten todos los 
        // promesas aun con errores y no lanza el 
        // catch hasta que esten temrinadas. 
    ].map(p => p.catch(e => e))).then((respuestas) => {

        // La respuesta viene con un arreglo de tipo[datos, existe]
        // donde datos es la respuesta de la BD y existe es true cuando
        // el documento existe.Si existen todos manda mensaje de error de
        // que ya esta duplicado y entra a moficar el existente para agregarle
        // su familia. 
        var existe = true;
        respuestas.forEach(element => {
            if (!element[1]) {
                existe = false;
                return;
            }
        });

        // Recuerda que hay que desempaquetar el resultado (por eso el [0] al final])
        var modelo = respuestas[0][0];
        var tamano = respuestas[1][0];
        var color = respuestas[2][0];
        var terminado = respuestas[3][0];


        var datos = {
            modelo: modelo,
            tamano: tamano,
            color: color,
            terminado: terminado,
            laserAlmacen: body.laserAlmacen,
            versionModelo: body.versionModelo,
            familiaDeProcesos: body.familiaDeProcesos,
            procesosEspeciales: body.procesosEspeciales
        };

        if (existe) {
            // Comprobamos que la combinación existe en modeloCompleto
            var existeElModeloCompleto = ModeloCompleto.findOne({
                modelo: datos.modelo._id,
                tamano: datos.tamano._id,
                color: datos.color._id,
                terminado: datos.terminado._id,
                versionModelo: datos.versionModelo,
            }).exec();

            existeElModeloCompleto.then(modCom => {
                if (!modCom) {
                    // No existe el modelo completo pero si existen los
                    // valores.

                    return crearUnModeloCompleto(datos, res);
                }

                // Existe el modelo completo ( la combinación esta registrada) entonces tiramos error. 
                let mod = `${modelo.modelo}-${tamano.tamano}-${color.color}-${terminado.terminado}-${datos.versionModelo}`;
                return RESP._400(res, {
                    msj: `El modelo ${mod} ya existe.`,
                    err: 'La combinación que ingresaste ya está registrada.',
                });
            }).catch(err => {
                return RESP._500(res, {
                    msj: 'Hubo un error comprobando si el modelo completo existe.',
                    err: err,
                });
            });
        } else {
            return crearUnModeloCompleto(datos, res);
        }
    }).catch((err) => {
        console.log(colores.danger('ERROR') + err);
        return RESP._500(res, {
            msj: 'Hubo un error grabando el modelo completo.',
            err: err,

        });
        // return res.status(500).json(msj);
    });
});


// ============================================
// END Guardamos un nuevo modelo.
// ============================================

// ============================================
// Eliminar un modelo completo( solo la combinación)
// ============================================

app.delete('/:id', (req, res) => {

    // Eliminamos la combinación y los folio lineas que 
    // contentengan ese modelo. 

    // var mc = ModeloCompleto.findOneAndDelete({ _id: req.params.id }, ((err, mcBorrado) => {
    //     if (err) {
    //         return RESP._500(res, {
    //             msj: 'Hubo un error borrando el modelo completo.',
    //             err: err,
    //         });
    //     }
    //     if (err) {
    //         return RESP._400(res, {
    //             msj: 'No existe el modelo completo.',
    //             err: 'El id que ingresaste no existe.',
    //         });
    //     }

    //     return RESP._200(res, 'Se eliminó correctamente el modelo', [
    //         { tipo: 'modeloCompleto', datos: mcBorrado },
    //     ]);

    // }));

    var mc = ModeloCompleto.findById(req.params.id).exec();
    mc.then(mcEncontrado => {
        if (!mcEncontrado) {
            return RESP._400(res, {
                msj: 'No existe el modelo. ',
                err: 'El id que ingresaste no existe.',
            });
        }

        return mcEncontrado.remove();
    }).then(mcRemovido => {
        return RESP._200(res, 'Se eliminó correctamente el modelo', [
            { tipo: 'modeloCompleto', datos: mcRemovido },
        ]);

    }).catch(err => {
        console.log(colores.danger('ERROR') + err);

        return RESP._500(res, {
            msj: 'Hubo un error eliminado el modelo.',
            err: err,
        });
    });



});

function newFunction() {
    return '../../models/modeloCompleto';
}

function crearUnModeloCompleto(datos, res) {

    var modeloCompleto = new ModeloCompleto({
        modelo: datos.modelo,
        tamano: datos.tamano,
        color: datos.color,
        terminado: datos.terminado,
        laserAlmacen: { laser: datos.laserAlmacen },
        versionModelo: datos.versionModelo,
        familiaDeProcesos: datos.familiaDeProcesos,
        procesosEspeciales: datos.procesosEspeciales
    });

    var mc = modeloCompleto.save();
    mc.then(modCom => {
        return RESP._200(res, 'Se guardo el modelo.', [
            { tipo: 'modeloCompleto', datos: modCom },
        ]);

    }).catch(err => {
        console.log(colores.danger('ERORR') + err);
        return RESP._500(res, {
            msj: 'Error al guardar el modelo completo',
            err: err,
        });
    });

}

function guardarModelo(dato) {
    return new Promise((resolve, reject) => {
        Modelo.findOne({ modelo: dato.modelo }, (err, modeloExistente) => {
            if (err) {
                reject(err);
            }

            if (modeloExistente) {
                // Si el modelo existe obtenemos su id.
                resolve([modeloExistente, true]);
            } else {
                // Si no existe lo guardamos
                modeloNuevo = new Modelo({
                    modelo: dato.modelo
                });

                console.log("Esto de aquí tambien me interesa mucho >>>>" + JSON.stringify(modeloNuevo));


                modeloNuevo.save((err, modeloGuardado) => {
                    if (err) {
                        reject(err);
                    }
                    // Y obtenemos su id para guardarlo en el modeloCompleto.
                    resolve([modeloGuardado, false]);
                });
            }
        });

    });

}

function guardarTamano(dato) {
    return new Promise((resolve, reject) => {
        Tamano.findOne({ tamano: dato.tamano }, (err, tamanoExistente) => {
            if (err) {
                reject(err);
            }
            if (tamanoExistente) {
                // Si el tamano existe obtenemos su id.
                resolve([tamanoExistente, true]);
            } else {
                // Si no existe lo guardamos
                modeloNuevo = new Tamano({
                    tamano: dato.tamano
                });

                modeloNuevo.save((err, tamanoGuardado) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    // Y obtenemos su id para guardarlo en el modeloCompleto.
                    resolve([tamanoGuardado, false]);
                });
            }
        });

    });

}

function guardarColor(dato) {
    return new Promise((resolve, reject) => {
        Color.findOne({ color: dato.color }, (err, colorExistente) => {
            if (err) {
                reject(err);
            }
            if (colorExistente) {
                // Si el color existe obtenemos su id.
                resolve([colorExistente, true]);
            } else {
                // Si no existe lo guardamos
                modeloNuevo = new Color({
                    color: dato.color
                });

                modeloNuevo.save((err, colorGuardado) => {
                    if (err) {
                        reject(err);
                    }
                    // Y obtenemos su id para guardarlo en el modeloCompleto.
                    resolve([colorGuardado, false]);
                });
            }
        });

    });

}

function guardarTerminado(dato) {
    return new Promise((resolve, reject) => {
        Terminado.findOne({ terminado: dato.terminado }, (err, terminadoExistente) => {
            if (err) {
                reject(err);
            }
            if (terminadoExistente) {
                // Si el terminado existe obtenemos su id.
                resolve([terminadoExistente, true]);
            } else {
                // Si no existe lo guardamos
                terminadoNuevo = new Terminado({
                    terminado: dato.terminado
                });

                terminadoNuevo.save((err, terminadoGuardado) => {
                    if (err) {
                        reject(err);
                    }
                    // Y obtenemos su id para guardarlo en el modeloCompleto.
                    resolve([terminadoGuardado, false]);
                });
            }
        });

    });

}


// ============================================
// COMPROBACIONES SOBRE MODELO. 
// ============================================
// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;