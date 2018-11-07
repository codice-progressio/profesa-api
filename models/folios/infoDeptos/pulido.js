var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var pulidoSchema = new Schema({
    peso10Botones: { type: Number, required: [true, 'El peso de 10 botones es necesario'] },
    pesoTotalBoton: { type: Number, required: [true, 'El espesor del botón es necesario'] },
    cantidad: { type: Number, required: [true, 'La cantidad de botón es necesaria'] },



}, { timestamps: true });
module.exports = pulidoSchema;