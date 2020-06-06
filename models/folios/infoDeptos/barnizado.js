var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var barnizadoSchema = new Schema({
    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean, default: false },
    peso10Botones: { type: Number},
    pesoTotalBoton: { type: Number }

}, { timestamps: true });

module.exports = barnizadoSchema;