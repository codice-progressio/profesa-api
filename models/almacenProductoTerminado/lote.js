const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const salidaLoteSchema = require('./salidaLote');
const entradaLoteSchema = require('./entradaLote.model');
const devolucionesLoteSchema = require('./devolucionLote');






/**
 * Almacen un lote con las diferentes cantidades de salida y 
 * de entrada. Lo importante del manejo de lotes es que se sepa la cantidad 
 * de boton que resta de uno y de otro para que se entreguen cantidades por lote. 
 * 
 */
const LoteSchema = new Schema({

    // /**`
    //  * Estos  valores on solo para guardar la referencia del lote. 
    //  */
    // orden:[ {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Folio.folioLinea.ordenes',
    // }],


    // numero: { type: String, required: [true, 'Es necesario que definas el numero de lote.'] },

    //----------------------------------------------------------------


    /**
     * La existencia actualizada de este lote. 
     * Esta actualizacion se hace primero cuando se recive para
     * producto terminado el lote y segundo 
     * cuando hay una salida o devolucionl 
     */
    existencia: { type: Number, required: [true, 'Es necesario definir la existencia.'] },
    /**
     * La cantidad del lote que entro.
     */
    cantidadEntrada: { type: Number, required: [true, 'Es necesario definir la cantidad que entro en este lote.'] },

    /**
     * El registro de las salidas que va teniendo el lote. 
     */
    salidas: [salidaLoteSchema],
    entradas: [entradaLoteSchema],
    devoluciones: [devolucionesLoteSchema],
    idOrden: String,

    validandoDevolucion: { type: Boolean, default: false, select: false },
    observaciones: { type: String },

    createAt:{ type: Date, default: Date.now}

});

/**
 *Agrega una salida a este lote. 
 *
 * @param {*} sal El objeto salida que se 
 * agregara. 
 */
let addSalida = function(sal) {
    sal.validando = true;
    this.salidas.push(sal);
    this.existencia -= sal.cantidad;

};

/**
 *Agreaga una devolucion a este lote. 
 *
 * @param {*} dev El objeto devolucion que se
 * agregara. 
 */
let addDevolucion = function(dev) {
    this.validandoDevolucion = true;
    dev.validando = true;
    this.devoluciones.push(dev);
    this.existencia += dev.cantidad;
};

LoteSchema.methods.addSalida = addSalida;
LoteSchema.methods.addDevolucion = addDevolucion;

module.exports = LoteSchema;