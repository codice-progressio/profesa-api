var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var empaqueSchema = new Schema({

    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean, default: false },

    contadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [() => { return this.guardar; }, 'Quien contó es obligatorio.']
    },
    cantidadDeBoton: { type: Number, required: [() => { return this.guardar; }, 'La cantidad de botón es obligatoria.'] }

}, { timestamps: true });
module.exports = empaqueSchema;