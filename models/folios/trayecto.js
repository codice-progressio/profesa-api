var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var trayectoSchema = new Schema({
    //El departamento en el que se encuentra actualmente.
    departamento: {
        type: Schema.Types.ObjectId,
        ref: 'Departamento',
        require: [true, 'El departamento es obligatorio.']
    },

    entrada: { type: Date },
    salida: { type: Date },
    orden: { type: Number, require: [true, 'El departamento es obligatorio.'] },
    // TODO: Quitar esta linea. 
    ANY: { type: String }
});
module.exports = trayectoSchema;