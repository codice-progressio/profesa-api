var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var ModeloCompleto = require('../models/modeloCompleto');
var Schema = mongoose.Schema;

var terminadoSchema = new Schema({

    terminado: { type: String, unique: true, required: [true, 'El terminado es necesario'] },


}, { collection: 'terminados' });
terminadoSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });

terminadoSchema.pre('findOneAndRemove', false, function(next) {
    const id = this._conditions._id;
    ModeloCompleto.eliminarRelacionados(id, 'terminado', next);
});

module.exports = mongoose.model('Terminado', terminadoSchema);