var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var fija = {
    esFija: { type: Boolean, default: false },
    pesoDeCapaFija: { type: Number, min: [0.01, 'El valor mínimo debe ser 0.01'] },
};

var capaSchema = {
    fija: { type: fija, validate: [validarPorcentaje, "La capa es fija y es necesrio definir el peso de la capa fija."] },
    nombre: { type: String },
    resinas: [{
        tipoDeMaterial: { type: Schema.Types.ObjectId, ref: 'Material', requiered: [true, 'El tipo de resina es obligatorio.'] },
        porcentaje: {
            type: Number,
            requiered: [true, 'Es necesario que definas el porcentaje de la capa.'],
            min: [0.01, 'El porcentaje mínimo permitido es 0.01%'],
            max: [100, 'El porcentaje máximo permitido es 100%'],
        }
    }],
    pigmentos: [{
        tipoDeMaterial: { type: Schema.Types.ObjectId, ref: 'Material', requiered: [true, 'El material es obligatorio.'] },
        gramosPorKilo: { type: Number, min: [0.001, "El valor mínimo de pigmento permitido es 0.001."] }
    }]
};


function validarPorcentaje(value) {
    // Si esFija = true entonces se tiene que definir el peso de la capa. 
    if (value.esFija) {
        return value.pesoDeCapaFija > 0.01;
    }
    return true;
}


module.exports = capaSchema;