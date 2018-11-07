var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var baston = {
    resinas: [{
        tipoDeMaterial: { type: Schema.Types.ObjectId, ref: 'Material', requiered: [true, 'El tipo de resina es obligatorio.'] },
        porcentaje: {
            type: Number,
            requiered: [true, 'Es necesario que definas el porcentaje de la capa.'],
            min: [0.01, 'El porcentaje mínimo permitido es 0.01%'],
            max: [100, 'El porcentaje máximo permitido es 100%'],
        }
    }],

    bombas: [{
        porcentajeDeMezcla: {
            type: Number,
            requiered: [true, 'El porcentaje de mezcla es necesario.'],
            min: [0.001, 'El porcentaje mínimo debe ser 0.001%.'],
            max: [100, 'El porcentaje máximo debe ser 100%.'],
        },
        barraRPM: {
            type: Number,
            requiered: [true, 'El RPM de la barra es obligatorio.']
        },
        oscilacion: {
            type: Number,
            requiered: [true, 'El RPM de la barra es obligatorio.']
        },
        canal: {
            type: Number,
            requiered: [true, 'El RPM de la barra es obligatorio.']
        },
        nombreBomba: { type: String, requiered: [true, 'El nombre de la bomba es necesario.'] },
        color: {
            pigmentos: [{
                tipoDeMaterial: { type: Schema.Types.ObjectId, ref: 'Material', requiered: [true, 'El material es obligatorio.'] },
                gramosPorKilo: { type: Number, min: [0.001, "El valor mínimo de pigmento permitido es 0.001."] },
                descripcion: { type: String }
            }]
        }
    }],
    observaciones: { type: String }

};

module.exports = baston;