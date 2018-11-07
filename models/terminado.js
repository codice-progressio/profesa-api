var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var terminadoSchema = new Schema({

    terminado: { type: String, unique: true, required: [true, 'El terminado es necesario'] },


}, { collection: 'terminados' });
terminadoSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });


module.exports = mongoose.model('Terminado', terminadoSchema);