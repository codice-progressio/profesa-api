var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var buratoSchema = new Schema({
    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean, default: false },
    peso10Botones: { type: Number, required: [true, 'Es necesario que definas el peso de 10 botonesa en gramos.'] },
    pesoTotalBoton: { type: Number, required: [true, 'Es necesario que definas el peso total del boton en kg.'] }


}, { timestamps: true });

module.exports = buratoSchema;