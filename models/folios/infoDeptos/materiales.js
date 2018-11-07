var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var materialesSchema = new Schema({
    // espesorPastilla: { type: Number, required: [true, 'El espesor de la pastilla es obligatorio'] },
    // fecha: { type: Date, required: [true, 'La fecha es obligatoria'] },
    cargo: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },

}, { timestamps: true });

module.exports = materialesSchema;