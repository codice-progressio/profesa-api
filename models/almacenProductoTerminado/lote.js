const mongoose = require('mongoose');

var Schema = mongoose.Schema;




/**
 * Almacen un lote con las diferentes cantidades de salida y 
 * de entrada. Lo importante del manejo de lotes es que se sepa la cantidad 
 * de boton que resta de uno y de otro para que se entreguen cantidades por lote. 
 * 
 */
var LoteSchema = new Schema({

    /**`
     * Estos  valores on solo para guardar la referencia del lote. 
     */
    orden: {
        type: Schema.Types.ObjectId,
        ref: 'Folio.folioLinea.ordenes',
    },

    numero: { type: String },

    //----------------------------------------------------------------


    /**
     * La existencia actualizada de este lote. 
     * Esta actualizacion se hace primero cuando se recive para
     * producto terminado el lote y segundo 
     * cuando hay una salida o devolucionl 
     */
    existencia: { type: Number },
    /**
     * La cantidad del lote que entro.
     */
    cantidadEntrada: { type: Number },

    /**
     * El registro de las salidas que va teniendo el lote. 
     */
    salidas: [{

        /**
         * El cliente al que se le va a surtir el boton. 
         */
        cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: [true, 'El cliente es necesario'] },
        cantidad: {
            type: Number,
            min: [1, 'El valor que ingresaste ( {VALUE} ) es menor que el permitido ( {MIN} ).'],
            max: [() => {
                // La cantidad de salida no puede superar a la existencia actual. 
                return this.existencia;
            }, 'El valor que ingresaste ( {VALUE} ) supera la existencia actual: {MAX}']
        }

    }],

    devoluciones: [{

        fecha: { type: Date },
        cantidad: {
            type: Number,
            min: [1, 'El valor que ingresaste ( {VALUE} ) es menor que el permitido ( {MIN} ).'],
            max: [() => {
                // La cantidad de salida no puede superar a la existencia actual. 
                return this.cantidadEntrada;
            }, 'El valor que ingresaste ( {VALUE} ) supera el tamano del lote orignal; {MAX}'],
            validate: {
                validator: function(v) {

                    return new Promise((resolve, reject) => {
                        // La cantidad de devolucion junto con la existenca no puede superar
                        // el tamano del lote.

                        if (this.cantidadEntrada < (this.existencia + v)) resolve(false);


                    });
                },
                message: me => `${me.value} supera la cantidad original del lote junto con las existencias.`
            }

        }
    }]
}, { timestap: true, _id: null, });


module.exports = LoteSchema;