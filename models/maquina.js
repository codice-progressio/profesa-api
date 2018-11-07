var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var gastoConsumo = require('../models/costos/gastoConsumo');

var Schema = mongoose.Schema;

var maquinaSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre de la máquina no puede estar vacio. Define un nombre.'] },
    clave: { type: String, required: [true, 'Es importante definir el nombre en clave. Si no lo tiene repite el nombre por favor.'] },
    anio: {
        type: Number,
        min: [1950, 'El año de fabricación no puede ser anterior a 1950.'],
        max: [new Date().getFullYear() + 2, `El año de fabricación no puede ser superior a ${new Date().getFullYear()+2}`],
    },

    nombresAnteriores: [{
        nombreAnterior: { type: String },
        fechaDeCambio: { type: Date },
    }],
    ordenes: [{
        type: Schema.Types.ObjectId,
        ref: 'Orden'
    }],

    departamentos: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'Departamento',
        }],
        validate: [Array.prototype.greaterThan0, 'El campo debe tener por lo menos un departamento definido.']
    },


    // Estos son los datos de trabajo de la maquina. 
    //  Por el momento sirven para saber que es lo que esta haceindo
    // la máquina de transformación. 
    datosDeTrabajo: {
        modeloTrabajando: {
            type: Schema.Types.ObjectId,
            ref: 'ModeloCompleto'
        }
    },
    numeroDeSerie: { type: String },

    gastos: {
        type: [gastoConsumo],
        validate: [Array.prototype.greaterThan0, 'El campo debe tener por lo menos un gasto definido']
    },

    costo: { type: Number, require: [true, "Para fines de costos este campo es obligatorio."], min: [1, 'La máquina no puede costar menos de un peso.'] },
    depreciacion: {
        type: Number,
        require: [true, "Los años de depreciación son obligatorios."],
        min: [0.83, 'El valor mínimo de depreciación es el equivalente a un mes en decimales. (.83)'],
        max: [15, 'La máquina no se puede depreciar en más de 15 años.']
    },
    observaciones: { type: String }

}, { collection: 'maquinas' });

maquinaSchema.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });

module.exports = mongoose.model('Maquina', maquinaSchema);