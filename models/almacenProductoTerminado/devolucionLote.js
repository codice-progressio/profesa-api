const mongoose = require('mongoose');

const Schema = mongoose.Schema;


var devolucionLoteSchema = new Schema({

    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: [true, 'El cliente es necesario'] },
    cantidad: {
        type: Number,
        validate: [{

                validator: function(v) {
                    return new Promise((resolve, reject) => {
                        resolve(1 < v);
                    });
                },
                msg: 'El valor que ingresaste ( {VALUE} ) es menor que el permitido ( 1 ).'
            },
            {
                isAsync: true,
                validator: function(v, cb) {

                    // La cantidad de devolucion junto con la existenca no puede superar
                    // el tamano del lote.
                    let cantidadEntrada = this.parent().cantidadEntrada;
                    let existencia = this.parent().existencia - v;

                    let msg = `El valor que ingresaste ( ${ v } ) supera la cantidad original del lote junto con las existencias.
                    Cantidad original: ${ cantidadEntrada }. Existencia: ${ existencia }`;

                    cb(cantidadEntrada < existencia, msg);

                },
            }

        ]
    },
    observaciones: { type: String }
}, { timestamps: true });

module.exports = devolucionLoteSchema;