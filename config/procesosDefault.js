var DEPARTAMENTOS = require('../config/departametosDefaults');

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
    },
    ALMACEN_DE_BOTON: {
        // Este proceso es para todas las familias de proceso y se
        // crea de manera automatica. 
        _n: 'SURTIR DESDE ALMACEN.',
        // El departamento al que esta relacinado.
        _departamento: DEPARTAMENTOS.ALMACEN_DE_BOTON._n,
        observaciones: 'Este proceceso se utiliza cuando el pedido se senala como surtir de almacen.',
        requiereProduccion: false,
    },
    PRODUCTO_TERMINADO: {
        // Este proceso es para todas las familias de proceso y se
        // crea de manera automatica. 
        _n: 'REMISION DE PRODUCTO TERMINADO.',
        // El departamento al que esta relacinado.
        _departamento: DEPARTAMENTOS.PRODUCTO_TERMINADO._n,
        observaciones: 'Este debe ser siempre el ultimo proceso de toda familia. En el se genera la remision para almacen.',
        requiereProduccion: false,
    },
    EMPAQUE: {
        // Este proceso es para todas las familias de proceso y se
        // crea de manera automatica. 
        _n: 'EMPAQUE DE PRODUCTO.',
        // El departamento al que esta relacinado.
        _departamento: DEPARTAMENTOS.EMPAQUE._n,
        observaciones: 'Este debe ser siempre el ultimo proceso de toda familia. En el se genera la remision para almacen.',
        requiereProduccion: false,
    },
    SELECCION: {
        _n: 'SELECCIÓN 1',
        // El departamento al que esta relacinado.
        _departamento: DEPARTAMENTOS.SELECCION._n,
        observaciones: 'Proceso de seleccion.',
        requiereProduccion: false,
    },
    LAVADO: {
        _n: 'LAVADO',
        // El departamento al que esta relacinado.
        _departamento: DEPARTAMENTOS.PULIDO._n,
        observaciones: 'Proceso de lavado para producto terminado.',
        requiereProduccion: false,
    },
    TRANSFORMACION_1ER_PASO: {
        _n: 'TRANSFORMACIÓN 1ER PASO',
        // El departamento al que esta relacinado.
        _departamento: DEPARTAMENTOS.TRANSFORMACION._n,
        observaciones: 'Basico de transformacion',
        requiereProduccion: true,
    },


};