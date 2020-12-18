var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var CapaCentrigufaSchema = require('./capaCentrifuga');
var BastonSchema = require('./baston');


var receta = new Schema({
    // Si es de centrifuga es true, si no es de bastón.
    centrifuga: [CapaCentrigufaSchema],
    baston: [BastonSchema],
    esBaston: Boolean,
    esCentrifuga: Boolean,
    observaciones: String

}, { timestamp: true });

receta.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });
module.exports = receta;