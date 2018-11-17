var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var materialesSchema = require('./infoDeptos/materiales');
var pastillaSchema = require('./infoDeptos/pastilla');
var transformacionSchema = require('./infoDeptos/transformacion');
var pulidoSchema = require('./infoDeptos/pulido');
var seleccionSchema = require('./infoDeptos/seleccion');
var empaqueSchema = require('./infoDeptos/empaque');

var trayectoSchema = new Schema({
    //El departamento en el que se encuentra actualmente.
    departamento: {
        type: Schema.Types.ObjectId,
        ref: 'Departamento',
        require: [true, 'El departamento es obligatorio.']
    },


    materiales: [materialesSchema],
    pastilla: [pastillaSchema],
    transformacion: [transformacionSchema],
    pulido: [pulidoSchema],
    seleccion: [seleccionSchema],
    empaque: [empaqueSchema],

    // Esta se guarda cuando se modifica la órden. 
    entrada: { type: Date },
    salida: { type: Date },
    orden: { type: Number, require: [true, 'El órden es obligatorio.'] },

    // El primer paso comenzar a trabajar una órden es recivirla en el proceso
    // actual donde esta. (trayecto).
    recivida: { type: Boolean, default: false },
    // La fecha en que se recive. 
    recepcion: { type: Date }

});
module.exports = trayectoSchema;