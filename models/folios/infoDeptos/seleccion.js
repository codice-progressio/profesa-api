var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var seleccionSchema = new Schema({

    quebrados: { type: Number },
    paraNegro: { type: Number },
    seleccionadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'Es obligatorio definir quien seleccionó.']
    },



}, { timestamps: true });
module.exports = seleccionSchema;