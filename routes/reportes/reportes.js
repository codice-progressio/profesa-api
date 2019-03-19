var express = require('express');
var app = express();
var RESP = require('../../utils/respStatus');
var Folio = require('../../models/folios/folio');
var Default = require('../../models/configModels/default');
var colores = require('../../utils/colors');



// <!-- 
// =====================================
//  Este route se encarga de generar todos los reportes
//  que necesitamos.
// =====================================
// -->



// REPORTE DE LASER.

app.get('/laser', (req, res) => {
    // <!-- 
    // =====================================
    //  OBJETIVO DEL REPORTE. 
    // =====================================
    // -->

    // Mostrar la cantidad de ordenes pendientes
    // que tienen por laserar el departameno. 

    Promise.all([
            Folio.find({
                // Filtrar por aquellas que no esten terminadas.
                terminado: false,
                'folioLineas.ordenesGeneradas': true,
                // $ne es no igual. !!! DAAA!!
                'folioLineas.laserCliente': { $ne: null }
            })
            // Convertimos los resultado en objetos json
            // ES NECESARIO HACERLO ASI PARA AGREGAR PROPIEDADES!!! OJO!!
            .lean()
            .exec(),
            Default.find().exec()

        ]).then(resp => {

            let foliosCoincidentes = resp[0]
            let defatults = resp[1][0];

            // Id del departamento de laser. 
            let idLaserDepto = defatults.DEPARTAMENTOS.LASER;
            let idAlmacen = defatults.DEPARTAMENTOS.ALMACEN;

            // El objeto que contendra las ordenes que vamos a devolver. 
            let ordenes = [];

            // Cargamos las referencias en todos las ordenes
            // por si las necesito en el GUI.
            foliosCoincidentes.forEach(folio => {
                folio.folioLineas.forEach(pedido => {
                    pedido.ordenes.map((orden) => {

                        orden['cliente'] = folio.cliente
                        orden['laserCliente'] = pedido.laserCliente
                        orden['observacionesFolio'] = folio.observaciones ? folio.observaciones : null
                        orden['observacionesPedido'] = pedido.observaciones ? pedido.observaciones : null

                        delete orden['cliente'].modelosCompletosAutorizados


                    })

                    ordenes = ordenes.concat(pedido.ordenes);


                });
            });

            // FILTRAR ORDENES QUE NO NECESITEMOS. 
            ordenes = ordenes.filter(orden => {
                // Si la orden ya paso por laser no debe aparecer. 
                // Filtramos los trayectosRecorridos y si el resultado es diferente
                // que cero quiere decir que ya paso por el departamento y devolvemos false para que no la agregue. 
                return !orden.trayectoRecorrido.filter(
                    trayecto => { return trayecto.departamento._id.toString() === idLaserDepto.toString(); }).length;
            });


            // LA ORDEN ESTA DISPONIBLE PARA TRABAJARSE SI EL DEPARTAMENTO ACTUAL EXISTE. 
            let ordenesAcomodadas = ubicarOrdenes(ordenes, idAlmacen, idLaserDepto);


            // RETORNAMOS ORDENES. 
            return RESP._200(res, null, [


                // { tipo: 'ordenes', datos: ordenes },
                { tipo: 'disponibles', datos: ordenesAcomodadas.disponibles },
                { tipo: 'departamentosPendientes', datos: ordenesAcomodadas.departamentosPendientes },
                { tipo: 'porSurtir', datos: ordenesAcomodadas.porSurtir },
                { tipo: 'trabajando', datos: ordenesAcomodadas.trabajando },
                { tipo: 'total', datos: ordenes.length },

            ]);



        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error al generar el reporte de laser.',
                err: err,
            });
        });

});

app.get('/transformacion', (req, res, next) => {
    // <!-- 
    // =====================================
    //  OBJETIVO DEL REPORTE. 
    // =====================================
    // -->

    // Mostrar la cantidad de ordenes pendientes
    // que tienen por transformar el departamento 

    // <!-- 
    // =====================================
    //  Que tenemos que hacer?
    // =====================================
    // -->

    Promise.all([
            Folio.find({
                // Filtrar por aquellas que no esten terminadas.
                terminado: false,
                // Que tengan las ordenes generadas.
                'folioLineas.ordenesGeneradas': true,
                // Si no va para almacen tiene que ir a transformacion. 
                'folioLineas.almacen': false
            })
            .lean()
            .exec(),
            Default.find().exec()
        ]).then(resp => {

            /**
             * Los folios que coincidieron con los filtros especificados 
             * en el find. 
             */
            let foliosCoincidentes = resp[0];
            /**
             * Los datos por default de donde queremos sacar informacion
             * importante como los departamentos. 
             */
            let defatults = resp[1][0];

            /**
             * Id del departamento de laser. 
             */
            let idTransformacionDepto = defatults.DEPARTAMENTOS.TRANSFORMACION;

            /**
             * 
             El objeto que contendra las ordenes que vamos a filtrar para eliminar
              las que no queremos. Almacena el primer bouche de ordenes para que
              despues las podamos ordenes. 
             * 
             */
            let ordenesParaAcomodarPorPasos = [];

            // Cargamos las referencias en todos las ordenes
            // por si las necesito en el GUI.
            foliosCoincidentes.forEach(folio => {
                folio.folioLineas.forEach(pedido => {

                    pedido.ordenes.map((orden) => {
                        orden['cliente'] = folio.cliente.nombre
                        orden['observacionesFolio'] = folio.observaciones
                        orden['observacionesPedido'] = pedido.observaciones
                        orden['laserCliente'] = pedido.laserCliente
                    })

                    ordenesParaAcomodarPorPasos = ordenesParaAcomodarPorPasos.concat(pedido.ordenes);
                });
            });

            /**
             * Este objeto almacena las apariciones que hay del departamento de transformacion 
             * en el trayectoNormal. 
             * 
             * La estructura que sigue es: 
             * 
             * objetoOrdenesPorAparicion[1] = [ordenesCon_Un_Pasos]
             * objetoOrdenesPorAparicion[2] = [ordenesCon_Dos_Pasos]
             * objetoOrdenesPorAparicion[n] = [ordenesCon_N_Pasos]
             */
            let objetoOrdenesPorAparicion = {}


            ordenesParaAcomodarPorPasos.map(ordenParaAcomodarPorPaso => {

                let cbFiltroTrayecto = (trayecto) => {
                    return trayecto.departamento._id.toString() === idTransformacionDepto.toString();
                };


                /**
                 * La cantidad de veces que aparece el departamento de transformacion en 
                 * en el trayecto normal de la orden.
                 * 
                 */
                let aparicionesDeTransformacion_TrayectoNormal = ordenParaAcomodarPorPaso.trayectoNormal.filter(cbFiltroTrayecto).length;

                /**
                 * La cantidad de apariciones del departamento de transformacion 
                 * que aparece en el trayecto recorrido. 
                 * 
                 */
                let aparicionesDeTransformacion_TrayectoRecorrido = ordenParaAcomodarPorPaso.trayectoRecorrido.filter(cbFiltroTrayecto).length;

                // Almacenamos este dato por que lo vamos a ocupar mas adelante para buscar la posicion de
                // la orden contra los pasos. 
                ordenParaAcomodarPorPaso.pasosRealizados = aparicionesDeTransformacion_TrayectoRecorrido;


                // Almacenamos la diferencia entre las apariciones. No eliminamos la orden por que 0 puede signifcar
                // que se esta trabajando o que ya no se esta trabajando. Para eso hay que corroborar la ubicacion actual
                // y se hace mas adelante. Si es positivo quiere decir que la orden se retransformo, como ahi que???
                // CREAMOS LA PROPIEDAD NUEVA orden.pasosPendientes
                ordenParaAcomodarPorPaso.pasosPendientes = aparicionesDeTransformacion_TrayectoNormal - aparicionesDeTransformacion_TrayectoRecorrido;

                if (!objetoOrdenesPorAparicion[aparicionesDeTransformacion_TrayectoNormal]) {
                    objetoOrdenesPorAparicion[aparicionesDeTransformacion_TrayectoNormal] = [];
                }

                // Agregamos la orden con su respectivo padre en base a la cantidad de apariciones de transformacion. 
                objetoOrdenesPorAparicion[aparicionesDeTransformacion_TrayectoNormal].push(ordenParaAcomodarPorPaso);

            });

            // Cada orden hay que ubicarla segun la ubicacionActual con respecto al paso en el que este.
            // Para eso tenemos que definir la cantidad de pasos que hay. Lo vamos a dejar dinamico
            // para que me vuele. XPPP Espero que no de errores!~!

            /**
             * Este objeto contiene las propiedades de los pasos. Es dinamico y en el
             * guardaremos de manera repetida las ordenes que vayan para cada cantidad de pasos
             * de esta manera. 
             *          
             *          objetoContenedorDePasos[1] = { 
             *                                          pedientes: [ordenesPara_1_Paso_pendiente] , 
             *                                          trabajando: [ordenesPara_1_Paso_trabajando],
             *                                          disponible: [ordenesPara_1_Paso_trabajando] 
             *                                        }
             *          objetoContenedorDePasos[n] = { 
             *                                          pedientes: [ordenesPara_n_Paso_pendiente] , 
             *                                          trabajando: [ordenesPara_n_Paso_trabajando],
             *                                          disponible: [ordenesPara_n_Paso_trabajando] 
             *                                        }
             * 
             */
            let objetoContenedorDePasos = {}

            /**
             * Obtenemos la clave de mayor valor desdeObjetoOrdenesPorAparacion. Esto equivale
             * al mayor numero de pasos que que una orden tiene en esta consulta. Si la
             * clave de mayor es 3 entonces en esta consulta solo habra 3 pasos. Si fuera 5 
             * seria 5, etc.
             */
            let claveDeMayorValor = Number(Object.keys(objetoOrdenesPorAparicion).sort().pop());

            // Creamos los espacios para cada paso.
            for (let i = 1; i < claveDeMayorValor + 1; i++) {
                objetoContenedorDePasos[i] = {
                    /** 
                     * Ordenes que estan pendientes de llegar y que tienen departamentos
                     * por delante aun para poder realizar este paso de transformacion. 
                     */
                    pendientes: [],
                    /**
                     * Ordenes que estan trabajandose actualmente en alguna maquina del 
                     * departamento de transformacion.  
                     */
                    trabajando: [],
                    /**
                     * Ordenes que ya estan en tranformacion pero que todavia no se les 
                     * asigna una maquina en la cual estan trabajando. 
                     */
                    disponibles: []
                };
            }

            /** Recorremos las ordenes separadas por cantidad de apariciones y despues vamos a revisar
             * En que paso se encuentran. Si tenemos una orden que tiene tres pasos pero ya termino 
             * el primero entonces debe aparecer en segundo y tercer paso unicamente.
             */
            for (const n_pasoKey in objetoContenedorDePasos) {
                if (objetoContenedorDePasos.hasOwnProperty(n_pasoKey)) {
                    /**
                     * Contiene las ordenes que corresponden a un paso. Pueden ser
                     * primer paso, segundo, etc. Empieza en ese orden hasta llegar
                     * al ultimo paso que se obtuvo de analizar las ordenes. ESTE ES 
                     * EL QUE TENEMOS QUE CARGAR.
                     */
                    const objeto_OrdenesDeEstePaso = objetoContenedorDePasos[n_pasoKey];


                    // NOS DISPONEMOS A GREGAR ORDENES DE primerPaso, n_pasoKey, etc.
                    for (const cantidadDePasosKey in objetoOrdenesPorAparicion) {
                        if (objetoOrdenesPorAparicion.hasOwnProperty(cantidadDePasosKey)) {
                            /**
                             * Obtenemos un arreglo delimitado por la cantidad de apariciones que tiene la orden
                             * en el trayecto normal del departamento de transformacion. Por ejemplo
                             * las que tienen tres pasos en tranformacion. || El objeto que contiene es arreglo
                             * se corre uno por uno y se carga aqui el arreglo.
                             * No son necesariamente consecutivos. Si no hay ordenes con segundo paso
                             * pero si con primero y tercero entonces el seguno paso nunca saldra en cantidadDePasosKey
                             * por que no existe esa llave y mucho menos se cargara en esta variable. 
                             */
                            const arregloDeOrdenesPorAparicion = objetoOrdenesPorAparicion[cantidadDePasosKey];

                            /*jshint loopfunc: true */
                            arregloDeOrdenesPorAparicion.forEach(ordenParaUbicar => {
                                // Esta orden tiene esta n cantidad de pasos para que se pueda almacenar?
                                if (n_pasoKey <= cantidadDePasosKey) {
                                    // Esta orden tiene pasos pendientes?
                                    if (ordenParaUbicar.pasosPendientes > 0) {

                                        // Si los pasos realizados son menores o iguales a 
                                        // n_pasoKey que estamos filtrando entonces seguimos. 
                                        // Es necesario corregir con mas uno por que los pasos 
                                        // realizados se calculan desde el trayecto recorrido donde
                                        // 0 trayectos de departamentos registrados equivalen al primer
                                        // paso de transformacion. Por eso, aqui ajustamos. 
                                        if (ordenParaUbicar.pasosRealizados + 1 <= n_pasoKey) {
                                            // ESTE PASO NO ESTA TERMINADO PERO PUEDE QUE ESTE TRABAJANDOSE LA ORDEN.
                                            if (ubicacionActualDeLaOrdenEsEstePaso(ordenParaUbicar, n_pasoKey, idTransformacionDepto)) {
                                                // Esta trabjandose? o esta disponible
                                                if (ordenParaUbicar.ubicacionActual.transformacion) {
                                                    if (ordenParaUbicar.ubicacionActual.transformacion.trabajando) {
                                                        objeto_OrdenesDeEstePaso.trabajando.push(ordenParaUbicar);
                                                    } else {
                                                        objeto_OrdenesDeEstePaso.disponibles.push(ordenParaUbicar);
                                                    }
                                                } else {
                                                    // Esta disponible por que estamos en este departamento
                                                    objeto_OrdenesDeEstePaso.disponibles.push(ordenParaUbicar);
                                                    if (!ordenParaUbicar.departamentosAntesDePaso) ordenParaUbicar.departamentosAntesDePaso = {}
                                                    ordenParaUbicar.departamentosAntesDePaso[n_pasoKey] = tieneDepartamentosAntesDe_N_Paso(ordenParaUbicar, idTransformacionDepto, n_pasoKey);
                                                }
                                            } else {
                                                objeto_OrdenesDeEstePaso.pendientes.push(ordenParaUbicar);
                                                if (!ordenParaUbicar.departamentosAntesDePaso) ordenParaUbicar.departamentosAntesDePaso = {}
                                                ordenParaUbicar.departamentosAntesDePaso[n_pasoKey] = tieneDepartamentosAntesDe_N_Paso(ordenParaUbicar, idTransformacionDepto, n_pasoKey);
                                            }
                                        } // ELSE Si los pasos son mayores quiere decir que ya pasamos
                                        // por este paso y pues no hacemos nada con la orden.
                                    }
                                } // ELSENo se almacena si no tiene pasos sufientes para el n_pasoKey en el que estamos. 
                            });
                        }
                    }
                }
            }

            return RESP._200(res, 'pruebas', [
                { tipo: 'objetoContenedorDePasos', datos: objetoContenedorDePasos },
            ]);


        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error generando el reporte de transformacion.',
                err: err,
            });
        });
});

app.get('/quimica', (req, res, next) => {

    /** 
     * =====================================
     *  OBJETIVO DEL REPORTE. 
     * =====================================
     * -->
     *
     * Mostrar la cantidad de ordenes pendientes
     * que tienen por hacer materiales. 
     *
     * <!-- 
     * =====================================
     *  Que vamos a obtener?
     * =====================================
     * 
     * Filtrar todos los folios que no son de almacen.
     * Filtrar todos los pedidos que tienen pendiente el departamento de quimica.
     * Sumar lo que esta pendiente. 
     * Sumar lo que se esta trabajando. 
     * 
     * 
     * 
     */
    Promise.all([
        Folio.find({
            // Filtrar por aquellas que no esten terminadas.
            terminado: false,
            // Que tengan las ordenes generadas.
            'folioLineas.ordenesGeneradas': true,
            // Si no va para almacen tiene que ir a quimica. 
            'folioLineas.almacen': false
        })
        .lean()
        .exec(),
        Default.find().exec()
    ]).then(resp => {

        /**
         * Los folios que coincidieron con los filtros especificados 
         * en el find. 
         */
        let foliosCoincidentes = resp[0];
        /**
         * Los datos por default de donde queremos sacar informacion
         * importante como los departamentos. 
         */
        let defatults = resp[1][0];

        /**
         * Id del departamento de quimica. 
         * @type { String }
         */
        let idQuimica = defatults.DEPARTAMENTOS.MATERIALES.toString();

        /**
         * Las ordenes obtenidas de los folios sin filtrar. 
         * @type {Orden []}
         */
        let ordenesSinFiltrar = []

        foliosCoincidentes.forEach(folio => {
            folio.folioLineas.forEach(pedido => {
                // Agregamos a todas las ordenes el cliente.
                pedido.ordenes.forEach((orden) => {
                    orden['cliente'] = folio.cliente
                    orden['laserCliente'] = pedido.laserCliente

                    // No necesitamos cargar los modelos completos autorizados!
                    delete orden['cliente'].modelosCompletosAutorizados
                })
                ordenesSinFiltrar = ordenesSinFiltrar.concat(pedido.ordenes);
            });
        });




        /**
         *  Las ordenes que estan pendientes de trabajarse en quimica.
         * @type { Orden [] }
         */
        let ordenesPendientes = ordenesSinFiltrar.filter(orden => {

            // Comprobamos que esta orden no este ubicada en el departamento
            // de materiales. 

            // Esta en el departamento???
            if (orden.ubicacionActual.departamento._id.toString() === idQuimica) {
                // Si esta el departamento entoces no esta pendiente.
                // Debe de estar disponible pero esto se filtra mas adelante.
                return false;
            }

            /**
             * Si no esta en materiales quiere decir que puede que ya haya pasado
             * el departamento o que aun no llegue. Para eso comprobamos 
             * el trayecto recorrido Buscamos las ordenes que no tengan a quimica 
             * entre su trayecto recorrido. 
             * 
             */


            // Filtramos el trayecto recorrido para buscar alguna coincidencia del 
            // departmanento de quimica.
            let aparicionDeDepto = orden.trayectoRecorrido.filter(trayecto => {
                return trayecto.departamento._id.toString() === idQuimica;
            });

            // Si no hay apariciones ( lenght === 0 ) quiere decir que esta orden esta pendiente. 
            return !aparicionDeDepto.length;
        });

        /**
         * Las ordenes que se estan trabajando en quimica. Estas son las que tienen ubicacionActual
         * en quimica y que estan senaladas como trabajando.
         * @type { Orden [] }
         */
        let ordenesTrabajandose = ordenesSinFiltrar.filter(orden => {

            let estaEnQuimica = orden.ubicacionActual.departamento._id.toString() === idQuimica;
            if (estaEnQuimica) {
                if (orden.ubicacionActual.materiales) {
                    return orden.ubicacionActual.materiales.trabajando;
                }
            }
            return false;
        });

        /**
         * Las ordenes que se estan en el departamento pero que no se estan trabajando. 
         * @type { Orden [] }
         */

        let ordenesDisponibles = ordenesSinFiltrar.filter(orden => {

            let estaEnQuimica = orden.ubicacionActual.departamento._id.toString() === idQuimica;
            if (estaEnQuimica) {
                // Este if es un safe por que si no existe el departamento nos manda a volar todo
                // el codigo. 
                if (orden.ubicacionActual.materiales) {
                    // si existe materiales quiere decir que ya esta disponible, pero
                    // no si se esta trabajando
                    if (orden.ubicacionActual.materiales.trabajando) {
                        // La orden esta trabajando entonces no debe estar disponible. 
                        return false;
                    } else {
                        return true;
                    }
                }
                // Esta ubicada en materiales y por tando esta disponible. 
                return true;
            }
            // Si no esta en quimica no puede estar disponible. 
            return false;
        });


        return RESP._200(res, null, [
            { tipo: 'pendientes', datos: ordenesPendientes },
            { tipo: 'trabajando', datos: ordenesTrabajandose },
            { tipo: 'disponibles', datos: ordenesDisponibles },
            // { tipo: 'TOTAL', datos: ordenesPendientes.length + ordenesTrabajandose.length + ordenesDisponibles.length },
            // { tipo: 'ordenesSinFiltrar', datos: ordenesSinFiltrar.length },

        ]);


    }).catch(err => {
        return RESP._500(res, {
            msj: 'Hubo un error al generar el reporte de Quimica.',
            err: err,
        });
    });
});




module.exports = app;

/**
 *Ubica las ordenes en tres tipos de arregls. 

 * @param {*} arrelgoDeOrdenesSinAcomodar
 * @param {*} idAlmacen
 * @returns
 */
function ubicarOrdenes(arrelgoDeOrdenesSinAcomodar, idAlmacen, idLaser) {

    let arregloDeOrdenes = {
        disponibles: [],
        departamentosPendientes: [],
        porSurtir: [],
        trabajando: []
    };


    arrelgoDeOrdenesSinAcomodar.forEach(ordenParaAcomodar => {
        // La orden esta en el departamento de laser?
        if (ordenParaAcomodar.ubicacionActual.departamento._id.toString() === idLaser.toString()) {
            // Si hay depto laser entonces es su ubicacion actual. 


            //Esta trabajando ya?? Si tiene el depto agregado quiere decir que si.
            if (ordenParaAcomodar.ubicacionActual.laser) {
                arregloDeOrdenes.trabajando.push(ordenParaAcomodar);
            } else {
                // Entonces esta disponible. 
                arregloDeOrdenes.disponibles.push(ordenParaAcomodar);
            }
        } else if (ordenParaAcomodar.desdeAlmacen) {
            // La orden viene desde almacen (surtida desde almacen)

            // Si el trayecto es superior a 2 esta surtida. 
            if (2 <= ordenParaAcomodar.trayectoRecorrido.length) {
                // Tiene departamentos por delante?
                ordenParaAcomodar.pasosParaLlegarALaser = tieneDepartamentosPorDelante(ordenParaAcomodar, idLaser);
                arregloDeOrdenes.departamentosPendientes.push(ordenParaAcomodar);

            } else {
                // El trayecto no supera a dos, quiere decir que no se ha surtido.
                arregloDeOrdenes.porSurtir.push(ordenParaAcomodar);
            }
        } else {
            // La orden viene desde produccion. 
            ordenParaAcomodar.pasosParaLlegarALaser = tieneDepartamentosPorDelante(ordenParaAcomodar, idLaser);
            arregloDeOrdenes.departamentosPendientes.push(ordenParaAcomodar);
        }
    });
    return arregloDeOrdenes;
}


/**
 * Busca los departamentos que tenga por delante el departamento de laser. 
 *
 * @param {*} orden
 * @param {*} idLaser
 * @returns El numero de departamentos faltantes. 
 * 
 */
function tieneDepartamentosPorDelante(orden, idLaser) {

    // Obtenemos el orden de la ubicacion actual. 
    let ordenUbicacionActual = orden.ubicacionActual.orden;

    let comenzarAContar = false;
    let contadorDeptosFaltantes = 0;

    // Recorremos todo el trayecto normal para ubicar en que paso estamos del trayecto. 
    for (let i = 0; i < orden.trayectoNormal.length; i++) {
        const trayectoNormal = orden.trayectoNormal[i];

        // Si llegamos a laser entonces nos detenemos en la busqueda. 
        if (trayectoNormal.departamento._id.toString() === idLaser.toString()) { break; }


        // Buscamos la ubicacion actual. To string por que no compara!
        if (trayectoNormal.orden.toString() === ordenUbicacionActual.toString()) {
            // Estamos en la ubicacion actual
            comenzarAContar = true;

        }

        // Contamos la distancia que falta para llegar a laser desde la ubicacion actual. 
        if (comenzarAContar) {
            contadorDeptosFaltantes++;

        };


    }

    return contadorDeptosFaltantes;
}



/**
 * Verifica si la orden se encuentra en el departamento de transformacion y
 * revisa si es el n_pasoKey. Si la orden esta en primer paso pero el n_pasoKey
 * corresponde al segundo paso entonces devuelve false. 
 * 
 * Comprobamos que la ubicacion actual sea el departamento de transformacion. Si no es, 
 * regresamos false por que en esta orden estamos evaluando en que numero de paso esta
 * ubicada la orden cuando ya llego a algun paso de transformacion. Si no ha llegado a ninguno
 * solo necesitamos poner la orden como pendiente. 
 * 
 *
 * @param {*} orden La orden que se va a evaluar. 
 * @param {*} n_pasoKey El paso. (Primer paso, segundo paso, etc.)
 * @param {*} idTransformacionDepto El id del departamento de transformacion. 
 * @returns True si se encuentra en este paso, false si no se encuentra en este paso. 
 */
function ubicacionActualDeLaOrdenEsEstePaso(orden, n_pasoKey, idTransformacionDepto) {
    // Es necesario ubicar en que paso estamos para saver si se agrega o no

    // Comprobamos que la ubicacion actual sea el departamento de transformacion. Si no es, 
    // regresamos false por que en esta orden estamos evaluando en que numero de paso esta
    // ubicada la orden cuando ya llego a algun paso de transformacion. Si no ha llegado a ninguno
    // solo necesitamos poner la orden como pendiente. 
    if (orden.ubicacionActual.departamento._id.toString() === idTransformacionDepto.toString()) {
        // Estamos en transformacion. Pero en que paso?
        // Para resolver eso necesitamos contar la cantidad de 
        // registros del departamento de transformacion en el trayecto recorrido
        //

        /**
         * El numero de pasos actuales realizados que estan registrados en trayecto recorrido. 
         * Este conteo debe de empezarse en 0 y no en uno por que cuando hay 0 
         * apariciones de el departamento de transformacion en el trayecto recorrido
         * quiere decir que aun no se empieza a trabajar el primer paso. 
         */
        let numeroDePasosActualesRegistrados = orden.trayectoRecorrido.filter(trayecto => {
            return trayecto.departamento._id.toString() === idTransformacionDepto.toString();
        }).length;

        // Sumamos uno por que tenemos que corregir contra n_pasoKey.
        // n_pasoKey empieza a contar desde uno y para encontrar el primer paso
        // en numeroDePasosActualesRegistrados tenemos que tener 0 registros en
        // trayecto recorrido. De ahi el ajuste. 
        numeroDePasosActualesRegistrados++;

        // Una vez echa la correccion comparamos. n_pasosKey debe <= a numeroDePasosActualesRegistrados
        // para que este paso este trabajando o disponible. 
        return n_pasoKey <= numeroDePasosActualesRegistrados;


    }
    // No estamos ubicados en el departamento y por tanto 
    // no se sanala como trabajando ni pendiente. 
    return false;


}


/**
 * Cuenta los departamentos que tiene por antes de llegar a n_PasoKey( Primer paso, segundo, etc.) Tomando
 * como referencia el departamento de transforamcion y el paso actual donde se encuentra la orden. 
 * 
 * @param {*} orden
 * @param {*} idTransformacionDepto
 * @param {*} n_pasoKey
 * @returns La cantindad de departamentos faltanes contra los n_pasoKey
 */
function tieneDepartamentosAntesDe_N_Paso(orden, idTransformacionDepto, n_pasoKey) {

    /**
     * Obtenemos el orden de la ubicacion actual. 
     * @type {Trayecto}
     */
    let ordenUbicacionActual = orden.ubicacionActual.orden;

    /**
     * Define si el contador de deptos debe empezar a sumarse.
     * Se utiliza cuando se encuentra la ubicacionActual
     * dentro del trayectoNormal
     * @type {Boolean}
     */
    let comenzarAContar = false;

    /**
     * El numero de departamento que faltan para llegar
     * a la ubicacion deseda. En este caso es el n_pasoKey
     */
    let contadorDeptosFaltantes = 0;

    if (!orden.departamentosAntesDePaso) {
        orden.departamentosAntesDePaso = {}
    }

    /**
     * Segun el paso obtenemos la ubicacion del departamento de tranformacion
     * que queremos buscar. EJEMPLO:
     * Queremos encontrar el segundo paso, entonces buscamos su
     * orden dentro del trayecto normal. 
     * @type { Trayecto[] }
     */
    let cantidadDePasosEnTrayectoNormal = orden.trayectoNormal.filter(trayecto => {
        return trayecto.departamento._id.toString() === idTransformacionDepto.toString();
    });

    /**
     * La ubicacion dentro del trayectoNormal del n_pasoKey que nos interesa ubicar.
     * @type {Trayecto} 
     */
    let ubicacionDeOrdenDe_n_Paso = cantidadDePasosEnTrayectoNormal[n_pasoKey - 1];

    // Recorremos todo el trayecto normal para ubicar en que paso estamos del trayecto. 
    for (let i = 0; i < orden.trayectoNormal.length; i++) {
        /**
         * El trayecto normal que queremos comparar. 
         */
        const trayectoNormal = orden.trayectoNormal[i];

        // Que paso estamos buscando??
        // estaos aqui!!!!
        // Si ya encontramos el paso que nos interesa nos detenemos. 
        if (trayectoNormal.orden.toString() === ubicacionDeOrdenDe_n_Paso.orden.toString()) break;

        // Buscamos la ubicacion actual. To string por que no compara!
        if (trayectoNormal.orden.toString() === ordenUbicacionActual.toString()) {
            // Estamos en la ubicacion actual
            comenzarAContar = true;
        }

        // Contamos la distancia que falta para llegar a laser desde la ubicacion actual. 
        if (comenzarAContar) {
            contadorDeptosFaltantes++;
        }
    }

    // Creamos un objeto que contenga la informacion de los pasos faltantes segun el 
    // paso para despues mandarla a llamar de manera facil. 
    return contadorDeptosFaltantes;
}



app.get('/historial/pedidos', (req, res) => {

    // Obtenemos todos los parametros. 

    let parametros = req.query;


    let objetoDeBusqueda = {
        terminado: false,
        numeroDeFolio: parametros.folio,
        'folioLineas.pedido': parametros.pedido,
        'folioLineas.modelo._id': parametros.modelo,
        'folioLineas.tamano._id': parametros.tamano,
        'folioLineas.color._id': parametros.color,
        'folioLineas.terminado._id': parametros.terminado,
        'cliente._id': parametros.cliente,
        'vendedor._id': parametros.vendedor,
    }

    // Eliminar vacios
    let keys = Object.keys(objetoDeBusqueda)

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!objetoDeBusqueda[key]) {
            delete objetoDeBusqueda[key]
        }
    }


    // desdeEl: parametros.desdeEl,
    // hasta: parametros.hasta,
    // orden: parametros.orden 
    console.log(objetoDeBusqueda)

    Folio.find(objetoDeBusqueda, { 'folioLineas.$.pedido': '1-0' }).then(folios => {

            return RESP._200(res, null, [
                { tipo: 'folios', datos: folios },
            ]);

        })
        .catch(err => {
            return RESP._500(res, {
                msj: 'Hubo un error filtrando los folios',
                err: err,
            });
        });

})