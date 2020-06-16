var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var empaqueSchema = new Schema({

    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean, default: false },

    contadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
       
    },
    cantidadDeBoton: { type: Number}

}, { timestamps: true });
module.exports = empaqueSchema;