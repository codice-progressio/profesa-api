const mongoose = require('mongoose');

const Schema = mongoose.Schema;


var devolucionLoteSchema = new Schema({

    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: [true, 'El cliente es necesario'] },
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
    },
    observaciones: { type: String }
}, { timestamps: true });

module.exports = devolucionLoteSchema;