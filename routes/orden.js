//Esto es necesario
var express = require('express');
var app = express();
var colores = require('../utils/colors');
var NVU = require('../config/nivelesDeUrgencia');

var Folio = require('../models/folios/folio');
var Departamento = require('../models/departamento');
var RESP = require('../utils/respStatus');
var CONST = require('../utils/constantes');
var Maquina = require('../models/maquina');


// ============================================
// Recive la órden que se le pase. 
// ============================================
app.put('/', (req, res) => {
    const id = req.body._id;
    const depto = req.body.departamento;
    Promise.all([
        existeFolioConOrden(id),
        existeDepartamento(depto)
    ]).then(respuestas => {
        const fol = respuestas[0];
        const departamento = respuestas[1];

        // Se encuentra en este departamento. 
        let orden = null;

        for (let i = 0; i < fol.folioLineas.length; i++) {
            const linea = fol.folioLineas[i];
            orden = linea.ordenes.id(id);
            if (orden) {
                break;
            }
        }

        const esDeptoActual = orden.ubicacionActual.departamento.nombre === departamento.nombre;
        if (!esDeptoActual) {
            return RESP._400(res, {
                msj: 'Esta órden no se encuentra en este departamento',
                err: `La órden existe pero no esta disponible para este departamento. Actualmente se encuentra registrada en '${orden.ubicacionActual.departamento.nombre}'`,
            });
        }

        if (orden.ubicacionActual.recivida) {
            return RESP._400(res, {
                msj: 'Está órden ya fue recivida.',
                err: 'La órden ya esta trabajandose.',
            });
        }

        // Recivimos la órden.
        orden.ubicacionActual.recivida = true;
        orden.ubicacionActual.recepcion = new Date();
        return fol.save();
    }).then(folioGrabado => {

        return RESP._200(res, 'Se recivio la órden.', [
            { tipo: 'todoCorrecto', datos: true },
        ]);

    }).catch(err => {
        console.log(err);
        return RESP._500(res, err);
    });

});

function existeFolioConOrden(id) {
    const uno = {
        'folioLineas.ordenes': { '$elemMatch': { _id: id } }
    };
    return new Promise((resolve, reject) => {
        const fol = Folio.findOne(uno)
            .populate('folioLineas.ordenes.ubicacionActual.departamento')
            .exec();
        fol.then(folioEncontrado => {
            if (!folioEncontrado) {
                reject(RESP.errorGeneral({
                    msj: 'No existe la órden.',
                    err: 'El id de la órden que ingresaste no existe.',
                }));
            }
            console.log(folioEncontrado);

            resolve(folioEncontrado);
        }).catch(err => {
            reject(RESP.errorGeneral({
                msj: 'Hubo un error buscando la órden.',
                err: err,
            }));
        });

    });

}

// ============================================
// Obtiene la órden de un departamento dado.
// ============================================

app.get('/:idOrden/:departamento', (req, res) => {

    const idOrden = req.params.idOrden;
    const departamento = (req.params.departamento).toUpperCase();
    console.log('Entro aqui.');

    Promise.all([
        orden(idOrden),
        existeDepartamento(departamento),
    ]).then(respuestas => {

        const orden = respuestas[0][0];
        if (orden.terminada) {
            return RESP._400(res, {
                msj: 'Esta órden ya esta terminada',
                err: 'La órden finalizó su trayecto. ',
            });
        }


        const modeloCompleto = respuestas[0][1];
        const depto = respuestas[1];

        const esDeptoActual = orden.ubicacionActual.departamento.nombre === depto.nombre;
        if (!esDeptoActual) {
            return RESP._400(res, {
                msj: 'Esta órden no se encuentra en este departamento',
                err: `La órden existe pero no esta disponible para este departamento. Actualmente se encuentra registrada en '${orden.ubicacionActual.departamento.nombre}'`,
            });
        }

        if (!orden.ubicacionActual.recivida) {
            const tamanoTrayecto = orden.trayectoRecorrido.length;
            // Si no existe trayecto tiene que dar el mensaje de que no ha sido en
            // entregada para producción. 
            let msj_Err = '';
            if (tamanoTrayecto > 0) {
                const deptoAnterior = orden.trayectoRecorrido[tamanoTrayecto - 1];
                msj_Err = `La órden está en espera de ser recivida. El último departamento que la manipulo fue ${deptoAnterior.nombre}`;
            } else {
                const EsteDepto = `Para poder registrarla es necesario que la recivas primero.`;
                msj_Err = `La órden todavía no ha sido entregada para empezar su producción. ` + EsteDepto;
            }
            return RESP._400(res, {
                msj: 'Órden sin recibir.',
                err: msj_Err,
            });

        }
        return RESP._200(res, null, [
            { tipo: 'orden', datos: orden },
            { tipo: 'modeloCompleto', datos: modeloCompleto },
        ]);


    }).catch(err => {
        return RESP._500(res, err);
    });
});

function orden(idOrden) {
    // Buscamos un folio que contenga la órden con el id que le pasemos
    // como parametro. Esto nos devuelve todo el folio pero solo la linea
    // que necesitamos. 
    const uno = {
        'folioLineas.ordenes': { '$elemMatch': { _id: idOrden } },
    };
    return new Promise((resolve, reject) => {
        const folioPromesa = Folio.findOne(uno)
            .populate('folioLineas.ordenes.ubicacionActual.departamento')
            .populate('folioLineas.ordenes.trayectoNormal.departamento')
            .populate({
                path: 'folioLineas.modeloCompleto',
                populate: {
                    path: 'modelo tamano color terminado laserAlmacen versionModelo'
                }
            }).exec();


        folioPromesa.then(folioEncontrado => {
                //No hubo ningúna coincidencia. 
                if (!folioEncontrado) {
                    // Como no hay coincidencia la órden no existe.
                    reject(RESP.errorGeneral({
                        msj: 'La órden no existe.',
                        err: 'El id que ingresaste no coincide con ningúna órden.',
                    }));
                } else {

                    const linea = folioEncontrado.folioLineas.find((linea) => {
                        return linea.ordenes.id(idOrden);
                    });
                    const orden = linea.ordenes.id(idOrden);

                    resolve([orden, linea.modeloCompleto]);
                }
            })
            .catch(err => {
                reject(RESP.errorGeneral({
                    msj: 'Hubo un error buscando la órden',
                    err: err,
                }));
            });
    });

}

function existeDepartamento(departamento) {

    return new Promise((resolve, reject) => {
        const d = Departamento.findOne({ nombre: departamento.toUpperCase() }).exec();
        d.then(departamentoEncontrado => {
                if (!departamentoEncontrado) {
                    reject(RESP.errorGeneral({
                        msj: 'No existe el departamento.',
                        err: 'El departamento que ingresaste no existe o no esta registrado.',
                    }));
                }
                resolve(departamentoEncontrado)
            })
            .catch(err => {
                reject(RESP.errorGeneral({
                    msj: 'Hubo un error buscando el departamento.',
                    err: err,
                }));
            });


    });
}

// ============================================
// OBTIENE LA LISTA DE ÓRDENES POR DEPARTAMENTO.
// ============================================
app.get('/:depto', (req, res) => {
    const depto = (req.params.depto).toUpperCase();

    const d = Departamento.findOne({ nombre: depto }).exec();

    d.then(departamento => {
        if (!departamento) {
            return RESP._400(res, {
                msj: 'Error al buscar el departamento.',
                err: 'El departamento que ingresaste no existe.',
            });
        }

        // Primero buscamos todos los folios que tengan órdenes actuales en ese departamento
        const busqueda = {
            // El la busqueda departamento no esta populado por eso buscamos en .departamento y no
            // en .departamento._id
            'folioLineas.ordenes.ubicacionActual.departamento': departamento._id,
            // Si la órden no esta terminada si la tomanos en cuenta. 
            'folioLineas.ordenes.terminada': false

        };

        return Folio.find(busqueda)
            .populate('folioLineas.ordenes.ubicacionActual.departamento')
            .populate({
                path: 'folioLineas.modeloCompleto',
                populate: {
                    path: 'modelo tamano color terminado marcaLaser versionModelo'
                }
            }).populate('folioLineas.laserCliente').exec();

    }).then(folios => {


        //    Creamos la estrucutura para guardar las órdenes por nivel. 
        const ordenes = {};
        for (var n in NVU.LV) {
            ordenes[NVU.LV[n]] = [];
        }

        // Recorremos todos los folios para extraer las órdenes. 
        for (let i = 0; i < folios.length; i++) {
            const folio = folios[i];
            // Recorremos la linea del folio para extraer órdenes. 
            for (let i = 0; i < folio.folioLineas.length; i++) {
                const linea = folio.folioLineas[i];
                // Recorremos los niveles ( El objeto que ya definimos para separar las órdenes)
                // para obtener los diferentes niveles que hay. 
                for (var nivel in ordenes) {
                    //Filtramos las órdenes 
                    linea.ordenes.filter(orden => {
                        // Si el nivel de urgencia coincide y tambien es el mismo depto. 
                        // OJO, SE HACE LA COMPROBACIÓN DOS VECES POR QUE ESTAMOS FILTRANDO 
                        // ARRIBA POR FOLIOS!!! Y NO POR ORDENES!! DE MANERA QUE TODAS LAS ÓRDENES DEL 
                        // FOLIO SE VAN A MOSTRAR!!! ESTEN EN EL DEPTO QUE ESTEN. 
                        if (orden.nivelDeUrgencia === nivel && orden.ubicacionActual.departamento.nombre === depto) {

                            var ordenO = orden.toObject();
                            ordenO.fechaFolio = folio.fechaFolio;

                            ordenO.modeloCompleto = linea.modeloCompleto;
                            ordenO.totalOrdenes = linea.ordenes.length;
                            ordenO.ordenViajera = `${folio.numeroDeFolio}-${i+1}-${orden.numeroDeOrden}`;
                            ordenO.laserCliente = linea.laserCliente;
                            ordenO.observacionesFolio = folio.observaciones;


                            ordenes[nivel].push(ordenO);
                            return true;
                        }
                        return false;
                    });

                    // Ordenamos por fecha cada nivel. 
                    ordenes[nivel].sort((a, b) => {
                        return a.fechaFolio - b.fechaFolio;
                    });
                }
            }
        }

        return RESP._200(res, null, [
            { tipo: 'ordenes', datos: ordenes },
        ]);


    }).catch(err => {
        return RESP._500(res, {
            msj: 'Hubo un error buscando las órdenes del departamento ',
            err: err,
        });
    });

});

// ============================================
// Guarda todas las órdenes. 
// ============================================

app.post('/', (req, res, next) => {

    var datos = req.body;
    Folio.findById(datos.idFolio, (err, folioEncontrado) => {
        // TODO: Mover a catch.
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar folio.',
                errors: err
            });
        }

        if (!folioEncontrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al buscar folio.',
                errors: 'El folio no existe'
            });
        }

        // Buscamos cada coincidencia de id de linea para
        // guardar los órdenes. 
        datos.folioLineas.forEach(lineaN => {

            // Buscamos dentro del folio una linea que coincida. 
            folioEncontrado.folioLineas.forEach(lineaParaActualizar => {

                if (lineaParaActualizar._id == lineaN._id) {
                    lineaParaActualizar.ordenesGeneradas = true;
                    lineaParaActualizar.ordenes = lineaN.ordenes;
                    return;
                }
            });

            // var lineaF = folioEncontrado.folioLineas.filter(l => { return linea._id === l._id; });
            // lineaF.ordenes = linea.ordenes;

        });
        // IMPORTANTE!!! El save lanza un pre en el modelo que
        // calcula el nivel de importancia del todo el folio. Por favor
        // no modifiques por otro sin antes revisar lo que estas haciendo. 
        folioEncontrado.save((err, folioGrabado) => {

            if (err) {
                console.log(err);
                return RESP._500(res, {
                    msj: 'Hubo un error grabando el folio.',
                    err: err,
                });
            }
            return RESP._200(res, 'Se guardo el folio correctamente.', [
                { tipo: 'folio', datos: folioGrabado },
            ]);
        });
    });
});

// ============================================
// Modifica una órden para agregarle un registro.
// ============================================

app.put('/:idOrden', (req, res) => {
    //Hay que saber para que depto es.
    let depto = req.query.depto;

    //Este camino modificado debe ser 
    // intercepado por el guard y si no es un usuario 
    // con permiso suficiente no se debe ejecutar este
    // controller. 
    const caminoModificadoAutorizado = req.query.caminoModificado;

    depto = depto.replace(/\'/g, '');
    const datos = req.body;

    // Obtenemos el id de la órden.
    const id = req.params.idOrden;

    //Buscamos el folio que coincida con la órden para modificarlo. 
    Folio.findOne({ 'folioLineas.ordenes._id': id }, (err, folio) => {

        if (err) {
            return RESP._500(res, {
                msj: 'Error al tratar de modificar la órden.',
                err: err,
            });

        }

        // Buscamos la órden que lo contenga
        let orden = null;
        for (let i = 0; i < folio.folioLineas.length; i++) {
            const linea = folio.folioLineas[i];
            orden = linea.ordenes.id(id);
            if (orden) {
                break;
            }
        }
        console.log(colores.log.debug('Buscando órden que contenga'));



        if (!orden) {

            return RESP._400(res, {
                msj: 'Erro al buscar la órden',
                err: 'No existe la órden',
            });
        }

        if (schemaParaOrden.hasOwnProperty(depto)) {
            console.log(colores.log.debug('Existe la operación para el depto'));

            // Buscamos el departamento.
            Departamento.findOne({ nombre: depto }, (err2, departamento) => {
                console.log(colores.log.debug('Buscando el departamento para su id: ' + departamento._id));


                if (err) {
                    return RESP._500(res, {
                        msj: 'Error al buscar el departamento.',
                        err: err2,
                        masInfo: [
                            { infoAdicional: 'error', dataAdicional: 'Se generó un error al buscar el departamento para asignarlo a la órden.' }
                        ]
                    });
                }

                if (!departamento) {

                    RESP._400(res, {
                        msj: 'No existe el departamento',
                        err: 'El departamento que se busco no existe.',
                    });
                }

                // ============================================
                // AQUI ES DONDE SE AVANZA EN LA ORDEN
                // ============================================

                schemaParaOrden[depto](orden, datos, departamento);

                let datosTransformacion = {
                    orden: orden,
                    departamento: departamento,
                    res: res,
                    callback: function() {
                        //Ejecutamos el grabado dentro de la función asincrona que esta en asignar máquina. 
                        folio.save(err => {
                            if (err) {
                                return RESP._500(res, {
                                    msj: 'Hubo un error actualizando el folio.',
                                    err: err,
                                });

                            }

                            // return res.status(200).json({
                            //     ok: true,
                            // });
                            return RESP._200(res, 'Órden modificada correctamente.', [
                                { tipo: 'todoCorrecto', datos: true },
                            ]);
                        });

                    },
                };

                if (!datosTransformacion.orden.ubicacionActual) {
                    //Si no tenemos más ubicaciónes entonces no es necesario 
                    // que hagamos la parte de transformación. 
                    datosTransformacion.orden.terminada = true;
                    datosTransformacion.callback();
                } else {
                    asingarAMaquinaTransformacion(datosTransformacion);

                }
            });


        } else {
            // return res.status(500).json({
            //     ok: false,
            //     msj: 'Departamento no definido como función.'
            // });
            return RESP._500(res, {
                msj: 'Departamento no defindo como funcón en sistema. ',
                err: err,
                masInfo: [
                    { infoAdicional: 'sys', dataAdicional: 'Es necesario definir una operación en el sistema para que se guarda en su respectivo schema. ' }
                ]
            });

        }
    });


});


var schemaParaOrden = {
    [CONST.DEPARTAMENTOS.MATERIALES._v]: materiales,
    [CONST.DEPARTAMENTOS.PASTILLA._v]: pastilla,
    [CONST.DEPARTAMENTOS.TRANSFORMACION._v]: transformacion,
    [CONST.DEPARTAMENTOS.PULIDO._v]: pulido,
    [CONST.DEPARTAMENTOS.SELECCION._v]: seleccion,
    [CONST.DEPARTAMENTOS.EMPAQUE._v]: empaque,
};


function seleccion(orden, datos, depto) {
    avanzarCamino(orden);
    orden.seleccion.push(datos);
}

function pulido(orden, datos, depto) {
    avanzarCamino(orden);
    orden.pulido.push(datos);
}

function transformacion(orden, datos, depto) {
    avanzarCamino(orden);
    orden.transformacion.push(datos);
}

function pastilla(orden, datos, depto) {
    avanzarCamino(orden);
    orden.pastilla.push(datos);
}

function materiales(orden, datos, depto) {
    avanzarCamino(orden);
    orden.materiales.push(datos);
}

function empaque(orden, datos, depto) {
    avanzarCamino(orden);
    orden.materiales.push(datos);
}



function avanzarCamino(orden, depto) {
    // Obtenemos la ubicacion actual. 
    const ubicacionActual = orden.ubicacionActual;

    // Obtenemos el siguiente departamento desde el trayecto 
    // normal.
    for (let i = 0; i < orden.trayectoNormal.length; i++) {
        const trayecto = orden.trayectoNormal[i];

        // Revisamos si estamos en este trayecto
        if (trayecto.orden === ubicacionActual.orden) {
            // Damos la salida.
            ubicacionActual.salida = new Date();
            // Si estamos en este trayecto entonces guardamos la ubicación actual
            // como trayecto recorrido
            orden.trayectoRecorrido.push(ubicacionActual);
            orden.ubicacionActual = orden.siguienteDepartamento;
            //No se da entrada por que hay que recivir la órden. 


            // Si hay todavía un departamento en el trayecto normal
            // entonces si ponemos siguiente departamento, si no, 
            // lo dejamos así.
            if ((orden.trayectoRecorrido.length >= orden.trayectoNormal.length)) {
                orden.terminada = true;

                return;
            } else {
                console.log('[IMPORTANTE]  =>>> Hay todavía trayecto NORMAL: ' + JSON.stringify(orden.trayectoNormal[i + 2]));
                console.log('Trayecto recorrido tama: ' + orden.trayectoRecorrido.length);
                orden.siguienteDepartamento = orden.trayectoNormal[i + 2];

            }


            return;
        }
    }

}




function asingarAMaquinaTransformacion(datos) {
    //Comprobamos que el trayecto actual se corresponda a 
    // TRANSFORMACIÓN.

    const DEPTO = CONST.DEPARTAMENTOS.TRANSFORMACION._n;

    let maquinasconProduccion = [];
    let maquinasSinProduccion = [];


    // UbicacionActual = TRANSFORMACION
    if (datos.orden.ubicacionActual.departamento.nombre === DEPTO) {
        // Buscar máquinas asigandas a transformacion
        Maquina.find({ departamentos: DEPTO }, (err, maquinasTransformacion) => {

            if (err) {
                return RESP._500(datos.res, {
                    msj: 'Hubo un error buscando las máquinas.',
                    err: err
                });
            }

            // Hay máquinas?
            if (!maquinasTransformacion) {
                RESP._400(res, {
                    msj: 'No hay máquinas asignadas a ' + DEPTO,
                    err: 'Es necesario asignar máquinas a este departamento.',
                    masInfo: [{
                        infoAdicional: CONST.ERRORES.MAS_INFO.TIPO_ERROR.NO_DATA.infoAdicional,
                        dataAdicional: CONST.ERRORES.MAS_INFO.TIPO_ERROR.NO_DATA.dataAdicional
                    }]
                });
            }

            //Separar por las que tienen producción. 
            maquinasConProduccion = maquinasTransformacion.filter(maquina => maquina.ordenes.length > 0);

            //Maquinas que no tiene producción. 
            maquinasSinProduccion = maquinasTransformacion.filter(maquina => maquina.ordenes.length === 0);

            if (maquinasConProduccion > 0) {

                //Agregamos máquina con pedido igual.
                let maquinasConPedidoIgual = [];
                maquinasConPedidoIgual = maquinasConProduccion.filter(maquina => {

                    for (let i = 0; i < maquina.ordenes.length; i++) {
                        const orden = maquina.ordenes[i];
                        return orden.pedido === datos.orden.pedido;
                    }

                });

                //¿Hay maquinas con pedido igual?
                if (maquinasConPedidoIgual > 0) {
                    filtrarMaquina(maquinasConPedidoIgual, datos);
                } else {
                    // Tomamos una máquina con producción. 
                    let maquinaConModeloIgual = [];
                    maquinaConModeloIgual = maquinasConProduccion.filter(maquina => {
                        for (let i = 0; i < maquina.ordenes.length; i++) {
                            const orden = maquina.ordenes[i];
                            return orden.modeloCompleto === datos.orden.modeloCompleto;
                        }
                    });

                    //¿Hay máquinas con modeloIgual?
                    if (maquinaConModeloIgual > 0) {
                        filtrarMaquina(maquinaConModeloIgual, datos);
                    } else {
                        // Tomamos una máquina con proudcción. 
                        let maquinaConTamanoIgual = [];
                        maquinaConTamanoIgual = maquinasconProduccion.filter(maquina => {
                            for (let i = 0; i < maquina.ordenes.length; i++) {
                                const orden = maquina.ordenes[i];
                                return orden.modeloCompleto.tamano.tamano === datos.orden.modeloCompleto.tamano.tamano;
                            }
                        });

                        // ¿Hay máquinas con tamaño igual?
                        if (maquinaConTamanoIgual > 0) {
                            filtrarMaquina(maquinaConTamanoIgual, datos);
                        } else {
                            //Tomamos una máquina de producción
                            datos.maquina = maquinasSinProduccion[0];
                            anadirOrdenAMaquinaYGrabar(datos);
                        }
                    }
                }
            } else {
                //Tomamos una máquina sin producción
                datos.maquina = maquinasSinProduccion[0];
                anadirOrdenAMaquinaYGrabar(datos);
            }
        });
    } else {
        // FIN
        //Si no es el departamento que nos interesa ejecutamos la función de grabado.
        datos.callback();
    }
}

function anadirOrdenAMaquinaYGrabar(datos) {

    // Añadimos la órden a la máquina.
    Maquina.findOne({ _id: datos.maquina._id }, (err, maquinaParaModificar) => {

        return RESP._500(datos.res, {
            msj: 'Hubo un error buscando la máquina.',
            err: err,
        });

        maquinaParaModificar.ordenes.push(datos.orden);
        // Añadimos la máquina actual a la órden. 
        orden.maquinaActual = maquinaParaModificar;
        // Guardamos los cambios echos en la máquina. 
        maquinaParaModificar.save(err => {
            if (err) {
                return RESP._500(datos.res, {
                    msj: 'Hubo un error guardando las modificaciones de la máquina',
                    err: err,
                });
            }
            //FIN
            datos.callback();
        });

    });
}

function filtrarMaquina(arrayDeMaquinas, datos) {
    // Filtramos la máquina con menor cantidad de órdenes.
    let maquinaConMenorCantidadDeOrdenes =
        arrayDeMaquinas.sort(
            (a, b) => {
                return a.ordenes.length - b.ordenes.length;
            })[0];
    datos.maquina = maquinaConMenorCantidadDeOrdenes;
    anadirOrdenAMaquinaYGrabar(datos);

}

// Esto exporta el modulo para poderlo utilizarlo fuera de este archivo.
module.exports = app;