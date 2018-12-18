var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var marcaLaser = require('../models/marcaLaser');
var modeloCompletoAutorizacionSchema = require('./modeloCompletoAutorizacion');

var clienteSchema = new Schema({
    sae: { type: String },
    nombre: { type: String, unique: true, required: [true, 'El	nombre	es	necesario'] },
    laserados: [marcaLaser],
    modelosCompletosAutorizados: [modeloCompletoAutorizacionSchema]

}, { collection: 'clientes' });

clienteSchema.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });

var autoPopulate = function(next) {
    this.populate('modelosCompletosAutorizados.modeloCompleto');
    next();
};

clienteSchema.pre('find', autoPopulate).pre('findOne', autoPopulate);


module.exports = mongoose.model('Cliente', clienteSchema);