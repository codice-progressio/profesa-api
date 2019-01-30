const mongoose = require('mongoose');

const Schema = mongoose.Schema;


var devolucionLoteSchema = new Schema({
    /** 
     * Este se necesita por que cuando grabamos 
     * con save se ejecutan las validaciones para todo
     * el modelo incluido cada elmento del array. Para esto, por cada 
     * elemento vuelve a sumar la existencia en cada validacion superando
     * el limite de existencia actual. Cuando anadimos un objeto devolucion
     * desde el metodo en lote.js addDevolucion ponemos este valor en tru
     * para solo validar este elemento del array. Los demas pasan bien. 
     */
    validando: { type: Boolean, default: false },

    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: [true, 'El cliente es necesario'] },
    cantidad: {
        type: Number,
        validate: [{

                validator: function(v) {
                    return new Promise((resolve, reject) => {
                        resolve(1 <= v);
                    });
                },
                msg: 'El valor que ingresaste ( {VALUE} ) es menor que el permitido ( 1 ).'
            },
            {
                isAsync: true,
                validator: function(v, cb) {
                    if (!this.validando) {
                        cb(true);
                    } else {
                        // La cantidad de devolucion junto con la existenca no puede superar
                        // el tamano del lote.
                        let cantidadEntrada = this.parent().cantidadEntrada;
                        let existencia = this.parent().existencia - v;

                        let msg = `El valor que ingresaste ( ${ v } ) supera la cantidad original del lote junto con las existencias.
                        Cantidad original del lote: ${ cantidadEntrada }. 
                        Existencia actual: ${ existencia }.
                        Total si se ingresa devolucion: ${ existencia + v }`;

                        //ponemos el false las banderas de validacion. 
                        this.parent().validandoDevolucion = false;
                        this.validando = false;
                        cb((existencia + v) <= cantidadEntrada, msg);

                    }
                },
            }

        ]
    },
    observaciones: { type: String }
}, { timestamps: true });

module.exports = devolucionLoteSchema;