var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var gastoSchema = new Schema({
    nombre: { type: String, unique: true, required: [true, 'El	nombre	es	necesario'] },
    costoPorHora: { type: Number, required: [true, 'El costo por hora es necesario'] },
    unidadPorHora: { type: String, required: [true, 'La unidad por hora es necesaria.'] },
    gastoDirecto: { type: Boolean, value: true }
}, { collection: 'gastos' }, { timestamp: true });

gastoSchema.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });
module.exports = mongoose.model('Gasto', gastoSchema);