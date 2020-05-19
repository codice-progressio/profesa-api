var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var transformacionSchema = new Schema({
    guardar: { type: Boolean, default: false },
    trabajando: { type: Boolean },

    cantidadDeBoton: {
       
        type: Number,
       
    },
    espesorBoton: { type: Number },
    bl: { type: Number},
    maquinaActual: { type: Schema.Types.ObjectId, ref: 'Maquina' },

}, { timestamps: true, _id: false });


module.exports = transformacionSchema;