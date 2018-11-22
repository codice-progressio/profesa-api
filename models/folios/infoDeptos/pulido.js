var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var pulidoSchema = new Schema({
    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean },

    peso10Botones: { type: Number, required: [() => { return this.guardar; }, 'El peso de 10 botones es necesario'] },
    pesoTotalBoton: { type: Number, required: [() => { return this.guardar; }, 'El espesor del botón es necesario'] },
    cantidad: { type: Number, required: [() => { return this.guardar; }, 'La cantidad de botón es necesaria'] },



}, { timestamps: true });
module.exports = pulidoSchema;