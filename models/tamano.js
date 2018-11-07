var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var VALIDACIONES = require('../utils/validaciones');

var Schema = mongoose.Schema;

var tamanoSchema = new Schema({

    tamano: {
        type: String,
        unique: true,
        required: [true, 'Es necesario definir el tamaño.']
    },

    estandar: {
        type: Number,
        min: [1, 'El valor mínimo permitido es 1.'],
        max: [999999, 'El valor máximo permitido es 999999.'],
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} no es un numero entero valido.'
        }
    },

    // Esto de aqui es para que mongose no escriba hospitals en vez de tamanos
}, { collection: 'tamanos' });

tamanoSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });


module.exports = mongoose.model('Tamano', tamanoSchema);