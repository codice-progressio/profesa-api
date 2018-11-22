var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var cantidades = {
    peso10Botones: { type: Number, required: [() => { return this.guardar; }, 'El peso de 10 botones es necesario'] },
    pesoTotalBoton: { type: Number, required: [() => { return this.guardar; }, 'El espesor del botón es necesario'] },
    espesorPastilla: { type: Number, required: [() => { return this.guardar; }, 'El espesor de la pastilla es obligatorio'] },

};

var pastillaSchema = new Schema({
    guardar: { type: Boolean, default: false },
    trabajando: { type: Boolean, default: false },
    cantidades: [cantidades],
    conto: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },

}, { timestamps: true });
module.exports = pastillaSchema;