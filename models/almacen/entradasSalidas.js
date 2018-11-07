var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;


var entradasSalidas = new Schema({

    cantidad: { type: Number, min: [0.0001, 'El mínimo permitido es 0.0001'] },
    esSalida: { type: Boolean, default: true },

}, { collection: 'entradasSalidas' }, { timestamp: true });

entradasSalidas.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });

module.exports = entradasSalidas;