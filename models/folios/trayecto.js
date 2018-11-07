var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var trayectoSchema = new Schema({
    //El departamento en el que se encuentra actualmente.
    departamento: {
        type: Schema.Types.ObjectId,
        ref: 'Departamento'
    },

    entrada: { type: Date },
    salida: { type: Date },
    orden: { type: Number }
});
module.exports = trayectoSchema;