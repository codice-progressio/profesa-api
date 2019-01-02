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
        // TODO: Debe mantener integridad y usar un solo schema. Ver notda de Modelo completo. 
        orden: { type: Number }
    }],
    nombre: { type: String, required: [true, 'El nombre es requerido.'] },
});


// var familiaDeProcesosSchema = new Schema({
//     procesos: [procesoSchema],
//     nombre: { type: String, required: [true, 'El nombre es requerido.'] },
// });

var autoUpdate = function(next) {
    this.populate('procesos.proceso');
    this.populate({
        path: 'procesos.proceso',
        populate: { path: 'departamento costos maquinas' }
    });
    next();
};


familiaDeProcesosSchema.pre('find', autoUpdate);




module.exports = mongoose.model('FamiliaDeProcesos', familiaDeProcesosSchema);