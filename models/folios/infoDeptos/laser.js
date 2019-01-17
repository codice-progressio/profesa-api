var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var buratoSchema = new Schema({

    guardar: { type: Boolean, default: false },
    trabajando: { type: Boolean },


    cantidadDeBoton: {
        min: [0, 'La cantidad no puede ser menor que 0.'],
        max: [999999, 'La cantidad no puede ser mayor que 999999.'],
        type: Number,
        required: [function() {
                console.log('LASER: Guardado esta en ' + this.guardar);

                return this.guardar;
            },
            'La cantidad de botón es necesaria.'
        ]
    },

    maquinaActual: { type: Schema.Types.ObjectId, ref: 'Maquina' },


}, { timestamps: true });

module.exports = buratoSchema;