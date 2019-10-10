var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var materialesSchema = new Schema({
    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean, },
    // espesorPastilla: { type: Number, required: [true, 'El espesor de la pastilla es obligatorio'] },
    // fecha: { type: Date, required: [true, 'La fecha es obligatoria'] },
    cargo: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [() => { return this.guardar; }, 'Es necesario definir quien cargó la órden.']
    },

    // maquinaActual: { type: Schema.Types.ObjectId, ref: 'Maquina' },

}, { timestamps: true });

module.exports = materialesSchema;