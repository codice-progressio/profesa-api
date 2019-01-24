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
                'folioLineas.laserCliente': { $ne: { $not: null } }
            })
            // Convertimos los resultado en objetos json
            .lean()
            .exec(),
            Default.find().exec()

        ]).then(resp => {


            let foliosCoincidentes = resp[0]
            let defatults = resp[1][0];

            // Id del departamento de laser. 
            let idLaserDepto = defatults.DEPARTAMENTOS.LASER;


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

            // Mostrar como pendiente de surtir si viene de alamcen
            // Si viene de produccion mostrar departamentos faltantes.            




            // RETORNAMOS ORDENES. 
            return RESP._200(res, null, [
                { tipo: 'ordenes', datos: ordenes },
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

module.exports = app;