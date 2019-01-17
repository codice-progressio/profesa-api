var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const procesosSchema = {
    procesoPadre: {
        type: Schema.Types.ObjectId,
        ref: 'Proceso',
    },
    proceso: {
        type: Schema.Types.ObjectId,
        ref: 'Proceso',
    },
    orden: { type: Number, require: [true, 'No se definio el órden del proceso.'] }
};




module.exports = procesosSchema;