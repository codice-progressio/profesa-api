var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Folio = require('../models/folios/folio');
var ModeloCompleto = require('../models/modeloCompleto');
var colores = require('../utils/colors');
var RESP = require('../utils/respStatus');
var Cliente = require('../models/cliente');


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

modeloSchema.pre('findOneAndRemove', false, function(next) {
    const id = this._conditions._id;
    ModeloCompleto.eliminarRelacionados(id, 'modelo', next);
});




module.exports = mongoose.model('Modelo', modeloSchema);