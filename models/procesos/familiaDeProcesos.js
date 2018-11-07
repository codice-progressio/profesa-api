var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var procesoSchema = require('./proceso');

var familiaDeProcesosSchema = new Schema({
    procesos: [{
        proceso: {
            type: Schema.Types.ObjectId,
            ref: 'Proceso',
            required: [true, "El proceso es necesario."]
        },
        orden: { type: Number }
    }],
    nombre: { type: String, required: [true, 'El nombre es requerido.'] },
});


// var familiaDeProcesosSchema = new Schema({
//     procesos: [procesoSchema],
//     nombre: { type: String, required: [true, 'El nombre es requerido.'] },
// });



module.exports = mongoose.model('FamiliaDeProcesos', familiaDeProcesosSchema);