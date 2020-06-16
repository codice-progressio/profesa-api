var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var pulidoSchema = new Schema({
    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean },

    peso10Botones: { type: Number},
    pesoTotalBoton: { type: Number},
    cantidad: { type: Number},



}, { timestamps: true });
module.exports = pulidoSchema;