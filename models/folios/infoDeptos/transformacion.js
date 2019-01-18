var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var transformacionSchema = new Schema({
    guardar: { type: Boolean, default: false },
    trabajando: { type: Boolean },

    cantidadDeBoton: {
        min: [0, 'La cantidad no puede ser menor que 0.'],
        max: [999999, 'La cantidad no puede ser mayor que 999999.'],
        type: Number,
        required: [function() {
                console.log('Guardado esta en ' + this.guardar);

                return this.guardar;
            },
            'La cantidad de botón es necesaria.'
        ]
    },
    espesorBoton: { type: Number, required: [() => { return this.guardar; }, 'El espesor del botón es necesario.'] },
    bl: { type: Number, required: [() => { return this.guardar; }, 'La velocidad es necesaria.'] },
    maquinaActual: { type: Schema.Types.ObjectId, ref: 'Maquina' },

}, { timestamps: true, _id: false });


module.exports = transformacionSchema;