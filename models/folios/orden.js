var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var trayecto = require('./trayecto');
var NVU = require('../../config/nivelesDeUrgencia');

const ordenSchema = new Schema({

    // Para facilitarnos la información. 
    modeloCompleto: {
        type: Schema.Types.ObjectId,
        ref: 'ModeloCompleto'
    },

    // Pedido. Lo creamos con la suma del folio y el órden del peddio ( FOL1-1 )
    pedido: { type: String },
    // El valor de la órden de la suma del folio, el órden del pedido y el numero de esta órden.
    orden: { type: String },

    numeroDeOrden: { type: Number, min: 1, required: [true, 'El número de órden es obligatorio'] },
    //La cantidad de la órden. Si media, una completa ó fracción. Antes era el 0.5 de 1
    unidad: { type: Number, min: 0.0001, max: 1, required: [true, 'La únidad de esta órden es requerida.'] },
    piezasTeoricas: { type: Number, min: 1, required: [true, 'Es necesario definir la cantidad esperada de esta órden.'] },


    piezasFinales: { type: Number, min: 1 },
    observaciones: { type: String },

    trayectoNormal: [trayecto],

    trayectoRecorrido: [trayecto],

    ubicacionActual: trayecto,
    //Si vuelve a este trayecto quiere decir
    // que se retoma el cause normal en ubicación.
    siguienteDepartamento: trayecto,

    nivelDeUrgencia: NVU.KEY,

    //Esta fecha no la cargamos desde el principio. 
    // La usamos solo como transporte para cuando 
    // se filtran las órdenes por departamento. 
    // si la modificamos desde el principio y la guardamos
    // sería un problema despues modificar la fecha si 
    // la del foio cambia. 
    fechaFolio: { type: Date },

    //La máquina en que se esta trabajando actualmente. 
    maquinaActual: {
        type: Schema.Types.ObjectId,
        ref: 'Maquina'
    },

    // Dictamina si la órden esta terminada. (En base a los departamento que recorrio. )
    terminada: { type: Boolean, value: false },
    porcentajeAvance: { type: Number, value: 0, max: 100, min: 0 },

});





module.exports = ordenSchema;