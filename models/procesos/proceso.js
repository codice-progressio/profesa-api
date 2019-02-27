var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var gastoConsumoSchema = require('../costos/gastoConsumo');
var FamiliaDeProcesos = require('../../models/procesos/familiaDeProcesos');
var ModeloCompleto = require('../../models/modeloCompleto');
var colores = require('../../utils/colors');

var procesoSchema = new Schema({
    // orden: { type: Number, required: [true, 'Es necesario definir el órden.'] },
    departamento: { type: Schema.Types.ObjectId, ref: 'Departamento', required: [true, "Es necesario especificar el departamento."] },
    nombre: { type: String, unique: true, required: [true, 'El nombre es requerido.'] },

    // CUIDADO!!! ELIMINAMOS AL CREACION DE PASOS PARA DAR PIE A 
    // AL USO DEL HIT. 


    // pasos: [pasoSchema],
    observaciones: { type: String },
    // especial: { type: Boolean, value: false },
    // gastos: {
    //     type: [gastoConsumoSchema],
    //     // validate: [Array.prototype.greaterThan0, 'El campo debe tener por lo menos un gasto definido']
    // },
    maquinas: [{ type: Schema.Types.ObjectId, ref: 'Maquina' }],

    // Si el proceso corresponde a una cadena que requiere producirse este 
    // valor se debe de poner en true. Por ejemplo, cuando se 
    // manda a metalizar se deja en false ( desde el almacen). Cuando son 
    // dobles pasos se debe poner en true.
    requiereProduccion: { type: Boolean, required: [true, 'Debes definir si este proceso requiere ser transformado para poder realizarse.'] },

    hit: { type: Schema.Types.ObjectId, ref: 'Hit' },

});

procesoSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });

let autoPopulate = function(next) {
    this.populate('departamento');
    // this.populate('gastos.gasto');
    this.populate({
        path: 'maquinas',
        populate: { path: 'gastos.gasto' }
    });
    next();

};

/**
 * Esta funcion elimina los datos relacionados al proceso que 
 * se va a eliminar.
 *
 * @param {*} next
 */
let eliminarRelacionados = function(next) {
    let idProceso = this._id;

    let promesas = [];

    // condiciones para remover
    let familiaPull = { $pull: { procesos: { proceso: idProceso } } };
    let mcPull = { $pull: { procesosEspeciales: idProceso } };

    promesas.push(FamiliaDeProcesos.update({ 'procesos.proceso': idProceso }, familiaPull));
    promesas.push(ModeloCompleto.update({ 'procesos': idProceso }, mcPull));

    Promise.all(promesas).
    then(resp => {
            console.log(`${colores.success('CORRECTO')}  Datos relacionados eliminados ${JSON.stringify(resp)}`);
            next();
        })
        .catch(err => {
            console.log(`${colores.danger('ERROR')}  Hubo un error eliminando los datos relacionados: ${err}`);
            throw err;
        });


};

/**
 * Comprueba que el proceso que se esta borrando no se elimine.
 *
 * @param {*} next
 */
let noEliminarProcesosPorDefault = function(next) {
    // Cargamos los procesos por defaul
    mongoose.models.Defaults.find().then(resp => {
            let idProcesoQueSeVaAEliminar = this._id;
            for (const key in resp[0].PROCESOS) {
                if (resp[0].PROCESOS.hasOwnProperty(key)) {
                    const id = resp[0].PROCESOS[key];
                    if (id.toString() === idProcesoQueSeVaAEliminar.toString()) {
                        const err = new Error('Este proceso es vital para el sistema y no se puede eliminar');
                        next(err);
                        return;
                    }
                }
            }
            next();
        })
        .catch(err => {
            next(err);
        });

};


procesoSchema
    .pre('find', autoPopulate)
    .pre('findOne', autoPopulate)
    .pre('remove', noEliminarProcesosPorDefault)
    .pre('remove', eliminarRelacionados);





module.exports = mongoose.model('Proceso', procesoSchema);