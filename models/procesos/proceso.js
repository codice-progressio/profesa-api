var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var gastoConsumoSchema = require('../costos/gastoConsumo');
var pasoSchema = require('../procesos/paso');

var procesoSchema = new Schema({
    // orden: { type: Number, required: [true, 'Es necesario definir el órden.'] },
    departamento: { type: Schema.Types.ObjectId, ref: 'Departamento', required: [true, "Es necesario especificar el departamento."] },
    nombre: { type: String, unique: true, required: [true, 'El nombre es requerido.'] },
    pasos: [pasoSchema],
    observaciones: { type: String },
    especial: { type: Boolean, value: false },
    gastos: {
        type: [gastoConsumoSchema],
        // validate: [Array.prototype.greaterThan0, 'El campo debe tener por lo menos un gasto definido']
    },
    maquinas: [{ type: Schema.Types.ObjectId, ref: 'Maquina' }],

});

procesoSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });

var autoPopulate = function(next) {
    this.populate('departamento');
    this.populate('gastos.gasto');
    this.populate({
        path: 'maquinas',
        populate: { path: 'gastos.gasto' }
    });
    next();

};

procesoSchema.pre('find', autoPopulate);



module.exports = mongoose.model('Proceso', procesoSchema);