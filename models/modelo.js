var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var modeloSchema = new Schema({
    modelo: {
        type: String,
        unique: true,
        required: [true, 'Es obligatorio definir el modelo.']
    },
    // Esto de aqui es para que mongose no escriba hospitals en vez de hospitales
}, { collection: 'modelos' });


modeloSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });

module.exports = mongoose.model('Modelo', modeloSchema);