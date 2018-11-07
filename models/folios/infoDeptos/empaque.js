var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var empaqueSchema = new Schema({
    contadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    cantidadDeBoton: { type: Number, required: [true, 'La cantidad de botón es obligatoria.'] }

}, { timestamps: true });
module.exports = empaqueSchema;