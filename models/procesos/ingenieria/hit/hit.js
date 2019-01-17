var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var ControlDeCalidadSchema = require('../hit/hit_controlDeCalidad');
var SecuenciaDeOperacionSchema = require('../hit/hit_secuenciaDeOperacion');
var VerificacionesSchema = require('../hit/hit_verificaciones');
var SaludSeguridadMedioAmbienteSchema = require('../hit/hit_saludSeguridadMedioAmbiente');

var Schema = mongoose.Schema;

var hitSchema = new Schema({

    // El codigo que identifica el hit. 
    codigo: { type: String, required: [true, 'Es necesario que definas el codigo.'], unique: [true, 'No puedes asignar el mismo codigo a dos hits diferentes.'] },
    // El nombre de la operacion que se realiza. 
    operacion: { type: String, required: [true, 'Es necesario definir el nombre de la operacion.'] },
    // El area donde se desempena la funcion. 
    area: { type: String, required: [true, 'El area es necesaria.'] },
    // Un cliente en especifico que solicita el hit. 
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente'
    },


    // El usuario que realizo el hit. 
    realizo: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, "Es necesario definir el usuario."]
    },

    controlDeCalidad: [ControlDeCalidadSchema],
    secuenciaDeOperacion: [SecuenciaDeOperacionSchema],
    verificaciones: [VerificacionesSchema],
    saludSeguridadMedioAmbiente: [SaludSeguridadMedioAmbienteSchema],

}, { collection: 'hits' }, { timeStamp: true });

hitSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });


var autoPopulate = function(next) {
    this.populate('realizo', '-password');
    this.populate('cliente');
    next();

};


hitSchema.pre('find', autoPopulate).pre('findById', autoPopulate);





module.exports = mongoose.model('Hit', hitSchema);