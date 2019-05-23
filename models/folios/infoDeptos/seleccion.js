var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var seleccionSchema = new Schema({
    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean, default: false },


    seleccionadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [() => { return this.guardar; }, 'Es obligatorio definir quien seleccionó.']
    },

    /** 
     * La cantidad de boton quebrado que separa seleccion. 
     */
    quebrados: { type: Number, min: ['El valor minimo permitido es 1.'], max: [99000, 'El valor maximo permitido es 99000.'] },
    /**`
     * Boton reves de laser. 
     */
    reves: { type: Number, min: ['El valor minimo permitido es 1.'], max: [99000, 'El valor maximo permitido es 99000.'] },
    /**
     * El borde roto.
     */
    despostillado: { type: Number, min: ['El valor minimo permitido es 1.'], max: [99000, 'El valor maximo permitido es 99000.'] },
    sinLaser: { type: Number, min: ['El valor minimo permitido es 1.'], max: [99000, 'El valor maximo permitido es 99000.'] },
    sinHoyos: { type: Number, min: ['El valor minimo permitido es 1.'], max: [99000, 'El valor maximo permitido es 99000.'] },
    efectoMalo: { type: String },
    /**
     * Todo lo que no este enlistado.
     */
    otros: { type: Number, min: ['El valor minimo permitido es 1.'], max: [99000, 'El valor maximo permitido es 99000.'] },
    /**
     * La descripcion del otro defecto.
     */
    descripcionDeOtro: { type: String }




}, { timestamps: true });
module.exports = seleccionSchema;