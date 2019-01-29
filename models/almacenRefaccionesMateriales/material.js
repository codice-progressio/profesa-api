var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var EntradasSalidasSchema = require('../almacen/entradasSalidas');

var Schema = mongoose.Schema;

var stock = {
    min: {
        type: Number,
        required: [true, 'El necesario definir el stock mínimo'],
        min: [1, "El stock mínimo es 1."],
    },
    max: {
        type: Number,
        required: [true, 'El necesario definir el estock máximo'],
        min: [1, "El stock máxicmo no puede ser menor que es 1."],
    }
};

function validarStock(value) {
    return value.min < value.max;
}

var tiposDeMateriales = {
    values: [
        'GENERAL',
        'RESINA',
        'PIGMENTO_RESINA',
    ],
    message: '"{VALUE}" no es un tipo de material válido.'
};

var materialSchema = new Schema({
    // El nombre del material.
    nombre: { type: String, unique: true, required: [true, 'El	nombre	es	necesario'] },
    // El costo por una unidad de almacen y no administrativo.
    //      EJEMPLO: 1 CUBETA. La unidad es una cubeta. El costo de la cubeta es de $2500.
    costoPorUnidad: { type: Number },
    // El peso de una unidad. 
    //      EJEMPLO: 1 CUBETA. La unidad es una cubeta. El peso de la cubeta en kg es de 10kg.
    kgDeUnidad: { type: String, required: [true, 'La unidad por hora es necesaria.'] },
    // La únidad que se mostrara para almacen. 
    unidadAlmacen: { type: String },

    stock: { type: stock, validate: [validarStock, 'El stock mínimo no puede ser mayor que el stock máximo.'] },

    existencia: { type: Number },

    // Una salida se marca como true y una entrada como false. 
    entradasSalidas: { EntradasSalidasSchema },

    tipo: { type: String, default: tiposDeMateriales[0], required: [true, 'Es obligatorio definir el tipo de material.'], enum: tiposDeMateriales },

}, { collection: 'materiales' }, { timestamp: true });

materialSchema.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });
module.exports = mongoose.model('Material', materialSchema);