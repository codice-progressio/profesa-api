const mongoose = require('mongoose');

const Schema = mongoose.Schema;


var salidaLoteSchema = new Schema({

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

}, { timestamps: true });

module.exports = salidaLoteSchema;