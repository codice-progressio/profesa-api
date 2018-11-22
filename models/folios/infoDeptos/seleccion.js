var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var seleccionSchema = new Schema({
    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean, default: false },

    quebrados: { type: Number },
    paraNegro: { type: Number },
    seleccionadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [() => { return this.guardar; }, 'Es obligatorio definir quien seleccionó.']
    },



}, { timestamps: true });
module.exports = seleccionSchema;