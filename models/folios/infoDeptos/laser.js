var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var laserSchema = new Schema({

    guardar: { type: Boolean, default: false },
    trabajando: { type: Boolean },


    cantidadDeBoton: {
        min: [1, 'La cantidad no puede ser menor que 1.'],
        max: [999999, 'La cantidad no puede ser mayor que 999999.'],
        type: Number,
        required: [function() {
                console.log('LASER: Guardado esta en ' + this.guardar);

                return this.guardar;
            },
            'La cantidad de botón es necesaria.'
        ]
    },

    bl: {
        type: Number,
        min: [1, 'La cantidad no puede ser menor que 1'],
        max: [500, 'La cantidad no puede ser menor que 500'],
        required: [() => { return this.guardar; }, 'La velocidad es necesaria.']
    },
    maquinaActual: { type: Schema.Types.ObjectId, ref: 'Maquina' },


}, { timestamps: true });

module.exports = laserSchema;