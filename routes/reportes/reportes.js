var express = require('express');
var app = express();
var RESP = require('../../utils/respStatus');
var Folio = require('../../models/folios/folio');
var Default = require('../../models/configModels/default');



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

app.get('/laser', (req, res, next) => {
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
            'folioLineas.ordenesGeneradas': true,
        }).exec()

    ])



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

                tieneDepartamentosPorDelante(ordenParaAcomodar, idLaser);
                arregloDeOrdenes.departamentosPendientes.push(ordenParaAcomodar);

            } else {
                // El trayecto no supera a dos, quiere decir que no se ha surtido.
                arregloDeOrdenes.porSurtir.push(ordenParaAcomodar);
            }
        } else {
            // La orden viene desde produccion. 
            tieneDepartamentosPorDelante(ordenParaAcomodar, idLaser);

            arregloDeOrdenes.departamentosPendientes.push(ordenParaAcomodar);


        }


    });

    return arregloDeOrdenes;

}


/**
 * 
 *
 * @param {*} orden
 * @param {*} idLaser
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

    orden.pasosParaLlegarALaser = contadorDeptosFaltantes;
}