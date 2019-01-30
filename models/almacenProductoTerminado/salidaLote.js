const mongoose = require('mongoose');

const Schema = mongoose.Schema;


var salidaLoteSchema = new Schema({

    /**
     * El cliente al que se le va a surtir el boton. 
     */
    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: [true, 'El cliente es necesario'] },
    cantidad: {
        type: Number,
        validate: [{
                validator: function(v) {
                    return new Promise((resolve, reject) => {
                        // El valor minimo no puede ser menor que 1;
                        resolve(1 < v);
                    });
                },
                msg: 'El valor que ingresaste ( {VALUE} ) es menor que el permitido ( 1 ).'
            },
            {
                isAsync: true,
                /**
                 * Esta funcion valida que la cantidad que se va a registrar como salida
                 * no supera la existencia actual que hay. Es necesario hacer un pequeno hackj
                 * por que el pre hook save que tenemos para calcular la existencia modifica 
                 * el atributo antes de antrat aqui y no podemos comparar correctamente. Para
                 * eso sumanos el valor ingresaso a la existencia y tenemos la existencia 
                 * actual. 
                 * 
                 * @param {number} v El valor que recivimos desde el validador(Que ingreso el usuario.)
                 * @param {any} cb El callback que genera mongoose y que nos permite agregar el mensaje personalizado.
                 */
                validator: function(v, cb) {
                    if (this.parent().validandoDevolucion) {
                        // Si estmamos validando una devolucion entonces no entramos aqui. 
                        cb(true);
                    } else {
                        let existencia = this.parent().existencia;
                        // Corregimos por que se aplica el pre donde calcula los totales
                        // en el pre save. Que es antes de entrar a validar. Por tanto 
                        // sumamos el valor ingresado para volver a la existencia actual. 
                        let msjError = `El valor que ingresaste ( ${v} ) es mayor que la existencia ( ${ existencia + v } ) de este lote.`;
                        cb(existencia > v, msjError)
                    };
                },
            },
        ]
    }

}, { timestamps: true });

module.exports = salidaLoteSchema;