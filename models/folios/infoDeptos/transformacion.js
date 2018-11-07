var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var transformacionSchema = new Schema({
    cantidadDeBoton: { type: Number, required: [true, 'La cantidad de botón es necesaria.'] },
    espesorBoton: { type: Number, required: [true, 'El espesor del botón es necesario.'] },
    bl: { type: Number, required: [true, 'La velocidad es necesaria.'] },
    maquinaActual: { type: Schema.Types.ObjectId, ref: 'Maquina' }

}, { timestamps: true });
module.exports = transformacionSchema;