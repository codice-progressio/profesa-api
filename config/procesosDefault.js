var DEPARTAMENTOS = require('../config/departametosDefaults');
var Proceso = require('../models/procesos/proceso');

module.exports = {
    CONTROL_DE_PRODUCCION: {
        // Este proceso es para todas las familias de proceso y se
        // crea de manera automatica. 
        _n: 'ENTREGA DE ÓRDENES A PROCESO',
        // El departamento al que esta relacinado.
        _departamento: DEPARTAMENTOS.CONTROL_DE_PRODUCCION._n,
        observaciones: 'Este proceso debe ir siempre al principio de todas las familias.',
        requiereProduccion: false,
    },
    LASER: {
        // Este proceso es para todas las familias de proceso y se
        // crea de manera automatica. 
        _n: 'LASERADO DE BOTON.',
        // El departamento al que esta relacinado.
        _departamento: DEPARTAMENTOS.LASER._n,
        observaciones: 'Este proceceso se utiliza cuando el pedido se senala como "laserar boton"',
        requiereProduccion: false,
    }
};