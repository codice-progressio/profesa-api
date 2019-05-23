var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ordenSchema = require('./orden');
var NVU = require('../../config/nivelesDeUrgencia');

var LaserCliente = require('../marcaLaser');

var procesosSchema = require('../procesos/procesos');


// <!-- 
// =====================================
//  validaciones
// =====================================
// -->


var Tenido = [{
    color: {
        type: String,
        require: [true, 'Es necesario que definas el color para teñir.']
    },
    cantidad: {
        type: Number,
        require: [true, 'Es necesario que definas la cantidad a teñir.'],
        min: [1, "La cantidad mínima a teñir es 1."]
    },
    observaciones: String,
    terminado: { type: Boolean, default: false },
    fechaTerminado: Date
}];

function comprobarCantidadesDeTenido(value) {
    var total = 0;
    value.forEach(e => {
        // Sumamos todas las cantidades que se pasaron. 
        total += e.cantidad;
    });
    // Si el total supera a la cantidad del pedido retornamos error. 

    if (this.cantidad < total) return false;
    return true;
}

// <!-- 
// =====================================
//  END validaciones
// =====================================
// -->

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
    laserCliente: LaserCliente,

    // Si se selecciona esta opción quiere decir que el botón
    // se tiene que surtir de almacen.
    almacen: {
        type: Boolean,
        default: false
    },

    ordenes: [ordenSchema],
    ordenesGeneradas: { type: Boolean, default: false },
    trayectoGenerado: { type: Boolean, default: false },
    porcentajeAvance: { type: Number, min: 0, max: 100 },

    // Para la descripcion de colores teñidos. Este solo va para el departamento de teñido. 
    // coloresTenidos: [{ type: Tenido, validate: [comprobarCantidadesDeTenido, "El total de botones a teñir supera el del pedido."] }]
    coloresTenidos: { type: Tenido, validate: [comprobarCantidadesDeTenido, "El total de botones a teñir supera el del pedido."] },

    // Este proceso debe afectar al órden en que se estable las órdenes. 
    procesos: [procesosSchema],
    observaciones: { type: String },
    observacionesVendedor: { type: String },
    terminado: { type: Boolean, default: false },
    fechaTerminado: Date,
    cantidadProducida: { type: Number, default: 0 }

    // Esto de aqui es para que mongose no escriba
    //  folioLineas en vez de folioLineaes
}, { timestamps: true });






module.exports = folioLineaSchema;