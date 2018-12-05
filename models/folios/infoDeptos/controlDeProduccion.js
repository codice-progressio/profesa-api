var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var controlDeProduccionSchema = new Schema({
    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean, default: false },
    // espesorPastilla: { type: Number, required: [true, 'El espesor de la pastilla es obligatorio'] },
    // fecha: { type: Date, required: [true, 'La fecha es obligatoria'] },
    entregadaAProduccion: { type: Date }

}, { timestamps: true });

module.exports = controlDeProduccionSchema;