var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var marcaLaser = require('../models/marcaLaser');
var Schema = mongoose.Schema;

var clienteSchema = new Schema({
    sae: { type: String },
    nombre: { type: String, unique: true, required: [true, 'El	nombre	es	necesario'] },
    laserados: [marcaLaser],
}, { collection: 'clientes' });

clienteSchema.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });


module.exports = mongoose.model('Cliente', clienteSchema);