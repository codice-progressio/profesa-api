var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ordenSchema = require('./orden');
var NVU = require('../../config/nivelesDeUrgencia');


const folioLineaSchema = new Schema({
    // El número de pedido que se asigna en el pre del save. (Tambien se asigna a la órden.);
    pedido: { type: String },

    // La suma de todos los factores de modelo que se ocupan

    modeloCompleto: { type: Schema.Types.ObjectId, ref: 'ModeloCompleto' },
    cantidad: {
        type: Schema.Types.Number,
        required: [true, 'La cantidad es necesaria']
    },

    nivelDeUrgencia: NVU.KEY,

    // Esta marca laser se tiene que duplicar por que modeloCompleto
    // tambien lleva marcaLaser, pero no son iguales. La de 
    // modeloCompleto es una marca que hace para almacen 
    // mientras que esta marca es la que es solicitada por el cliente.
    laserCliente: {
        type: Schema.Types.ObjectId,
        ref: 'MarcaLaser'
    },

    // Si se selecciona esta opción quiere decir que el botón
    // se tiene que surtir de almacen.
    almacen: {
        type: Boolean,
        default: false
    },

    ordenes: [ordenSchema],
    ordenesGeneradas: { type: Boolean, default: false },
    trayectoGenerado: { type: Boolean, default: false },
    porcentajeAvance: { type: Number, min: 0, max: 100 }




    // Esto de aqui es para que mongose no escriba
    //  folioLineas en vez de folioLineaes
}, { timestamps: true });



module.exports = folioLineaSchema;