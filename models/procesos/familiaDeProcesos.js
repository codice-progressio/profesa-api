let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let procesoSchema = require('./proceso');
var ModeloCompleto = require('../modeloCompleto');
var colores = require('../../utils/colors');


let familiaDeProcesosSchema = new Schema({
    procesos: [{
        proceso: {
            type: Schema.Types.ObjectId,
            ref: 'Proceso',
            required: [true, "El proceso es necesario."]
        },
        // TODO: Debe mantener integridad y usar un solo schema. Ver notda de Modelo completo. 
        orden: { type: Number },
        // Copia del interior de: Boolean, required: [true, 'Debes definir si este proceso requiere ser transformado para poder realizarse.'] }
    }],
    nombre: { type: String, required: [true, 'El nombre es requerido.'] },
    // Familias que requieren que el producto este terminado para poderse asignar. 
    soloParaProductoTerminado: { type: Boolean, default: false },
    observaciones: String
});

let autoPopulate = function(next) {
    this.populate('procesos.proceso');
    this.populate({
        path: 'procesos.proceso',
        populate: { path: 'departamento costos maquinas' }
    });
    next();
};

/**
 *Esta funcion elimina los datos relacionados a la familia de procesos como 
 son el modelo completo. 
 *
 * @param {*} next 
 */
let eliminarRelacionados = function(next) {

    // Obtenemos el id de la familia. 
    var idFamilia = this._conditions._id;

    // Buscamos todos los modelos completos relacionados. 


    ModeloCompleto.deleteMany({ familiaDeProcesos: idFamilia })
        .then(resp => {
            console.log(colores.info('DATOS RELACIONADOS ELIMINADOS') + 'Se eliminaron los modelos completos relacionados a esta familia.');
            next();
        })
        .catch(err => {
            console.log(colores.danger('ERROR EN MIDDLEWARE=> familiaDeProcesos.js: ') + err);
            throw new Error(err);
        });

};

/**
 *Esta funcion revisa si la familia tiene el proceso Entrega de ordenes a produccion
 como primera opcion. Simpre debe ser asi y por tanto si no lo tiene manda error. 
 *
 * @param {*} next
 */
var comprobarQueLaFamiliaTieneElProcesoEntregaDeOrdenesAProduccion = function(next) {

    // Obtenemos los id por default. 

    mongoose.models.Defaults.find().exec().then(defaults => {
            // Obtenemos el id que nos interesa. 
            let idControlDeProduccion = defaults[0].PROCESOS.CONTROL_DE_PRODUCCION;

            let i_fueraDeOrden;

            // Comprobamos que la familia lo tenga. 
            for (let i = 0; i < this.procesos.length; i++) {
                const procesos = this.procesos[i];
                if (procesos.proceso._id === idControlDeProduccion) {
                    // Esta el proceso, pero es el primero?

                    if (i === 0) {
                        // Esta al principio pero parece que el orden no esta en 0.
                        if (procesos.orden !== 0) procesos.orden = 0;
                        next();
                        return;
                    }

                    i_fueraDeOrden = i;

                    //Lo tiene pero no esta al principio. Continuamos por que no podemos
                    // modificar un un arreglo mientras lo recorremos. 
                    break;
                }
            }

            // Obtenemos el objeto procesos. 
            let mover = this.procesos.splice(i_fueraDeOrden, 1)[0];

            // Asigmaos el orden.
            mover.orden = 0;

            // Lo agregamos al principio. 
            this.procesos.unshift(mover);

            // Actualizamos la propiedad orden.
            for (let i = 0; i < this.procesos.length; i++) {
                const procesos = this.procesos[i];
                procesos.orden = i;
            }

            next();

        })
        .catch(err => {
            next(err);
        });



};




familiaDeProcesosSchema
    .pre('findOneAndRemove', eliminarRelacionados)
    .pre('find', autoPopulate)
    .pre('findOne', autoPopulate)
    .pre('findById', autoPopulate)
    // El orden es importante por que estamos suponiendo que hay un _id a la 
    // hora de comprobar este pre. 
    .pre('save', comprobarQueLaFamiliaTieneElProcesoEntregaDeOrdenesAProduccion);



module.exports = mongoose.model('FamiliaDeProcesos', familiaDeProcesosSchema);