var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gastoConsumoSchema = new Schema({
    gasto: {
        type: Schema.Types.ObjectId,
        ref: 'Gasto',
        required: [true, 'Es necesario que definas por lo menos un gasto.']
    },
    consumo: { type: Number, require: [true, 'Para los calculos de costos es necesario definir el consumo de la máquina.'], min: [0.0001, 'El consumo mínimo debe ser 0.0001'] }
});

module.exports = gastoConsumoSchema;