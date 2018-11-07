var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var pastillaSchema = new Schema({
    espesorPastilla: [{ type: Number, required: [true, 'El espesor de la pastilla es obligatorio'] }],
    cantidadPastilla: { type: Number, required: [true, 'La cantidad de pastilla es obligatoria'] },
    conto: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },

}, { timestamps: true });
module.exports = pastillaSchema;