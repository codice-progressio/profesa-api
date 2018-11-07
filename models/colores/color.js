var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var receta = require('./receta');

var Schema = mongoose.Schema;

var colorSchema = new Schema({

    color: { type: String, unique: true, required: [true, 'El	color	es	necesario'] },
    receta: { type: receta, validate: [validarSoloUnTipoDeReceta, 'Un color solo puede tener receta para centrifuga ó para bastón.'] },



}, { collection: 'colores' });

function validarSoloUnTipoDeReceta(value) {
    return !(value.centrifuga.length > 0 && value.baston.length > 0);
}

colorSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });

module.exports = mongoose.model('Color', colorSchema);