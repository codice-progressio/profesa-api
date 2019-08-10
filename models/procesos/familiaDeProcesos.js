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
 Y tambien los procesos de empaque y producto terminado respectivamente al final 
 *
 * @param {*} next
 */
var comprobarQueLaFamiliaTieneElProcesoObligatorios = function(next) {

    // Obtenemos los id por default. 

    mongoose.models.Defaults.find().exec().then(defaults => {
            console.log('estamos aqui')
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


/**
 *Esta funcion se encarga de comprobar que el proceso de empaque y producto terminado
 se encuentren en todas las familias de procesos y que sean los dos ultimos en el orden
 mencionado. 
 *
 * @param {*} next
 */
function comprobarEmpaqueYProductoTerminado(next) {
    mongoose.models.Defaults.find().exec().then(defaults => {
            /**
             * El id del proceso de empaque final. 
             */
            let idEmpaque = defaults[0].PROCESOS.EMPAQUE.toString();

            /**
             * El id del producto terminado. (El proceso que debe ser final. );
             */
            let idProductoTerminado = defaults[0].PROCESOS.PRODUCTO_TERMINADO.toString();

            return Promise.all([
                mongoose.models.Proceso.findById(idEmpaque).exec(),
                mongoose.models.Proceso.findById(idProductoTerminado).exec()
            ])

        }).then((resp) => {
            let procesoEmpaque = resp[0]
            let procesoProductoTerminado = resp[1]

            // El orden es importante.
            this.procesos = agregarProcesoAlFinal(procesoEmpaque, this.procesos);
            this.procesos = agregarProcesoAlFinal(procesoProductoTerminado, this.procesos);
            next();

        })
        .catch(err => {
            next(err);
        });

}


/** 
 * Esta funcion es para agregar procecesos al final de una lista de de 'procesos'.
 * Recordando que es un objeto diferente de proceso. Procesos contiene el numero de orden
 * y el proceso. 
 * 
 * Llama a la funcion que esta aqui mismo pero para que se pueda utlizar por fuera. 
 * 
 */
familiaDeProcesosSchema.statics.agregarProcesoAlFinal = function(procesoAAgregar, procesos) {
    return agregarProcesoAlFinal(procesoAAgregar, procesos)
}

/**
 *Agrega al final el proceso que se le pase como paramentro. Si existe, lo recorre.
 * @param {*} procesoAAgregar El proceso que se quiere agregar al final. 
 * @param {*} procesos La lista de procesos que se quiere modificar. 
 * @returns La lista de procesos modificada. 
 */
function agregarProcesoAlFinal(procesoAAgregar, procesos) {
    /**
     * Define si existe el proceso dentro del arreglo por lo menos una vez. 
     * Si asi es lo va a recorrer. La cantidad de existencias que haya. 
     */
    let existe = false
        /**
         * La posicion donde se encuentra la coincidencia que se va a acomodar. 
         */
    let posicion = 0

    // Recorremos todo el arreglo buscando el proceso. 
    for (let i = 0; i < procesos.length; i++) {
        const proceso = procesos[i];
        if (proceso.proceso._id.toString() === procesoAAgregar._id.toString()) {
            existe = true
            posicion = i
        }

    }

    if (existe) {
        // es el ultimo?
        if (posicion !== procesos.length - 1) {
            // No es el ultimo, lo movemos al ultimo cortando. 
            // OJO!!! Se obtiene un arreglo y no directamente el objeto de tipo
            // procesos. Para poder acceder al objeto hay que obtener el primer elemento del 
            // array
            let proceso = procesos.splice(posicion, 1)[0]
            procesos.push(proceso)
        }
        // Es el ultimo, no hacemos nada. 
    } else {
        // No existe. Lo creamos. 
        procesos.push({ proceso: procesoAAgregar, orden: 0 });
    }

    return procesos;
}


function ajustarPropiedadOrden( next )
{
    // Ajustamos la propiedad orden para que coincida con el indice del 
    // arreglo
    for (let i = 0; i < this.procesos.length; i++) {
        const procesos = this.procesos[i];
        procesos.orden = i
    }
    next()
}


familiaDeProcesosSchema
    .pre('findOneAndRemove', eliminarRelacionados)
    .pre('find', autoPopulate)
    .pre('findOne', autoPopulate)
    .pre('findById', autoPopulate)
    // El orden es importante por que estamos suponiendo que hay un _id a la 
    // hora de comprobar este pre. 
    .pre('save', comprobarQueLaFamiliaTieneElProcesoObligatorios)
    .pre('save', comprobarEmpaqueYProductoTerminado)

    // Por ultimo revisamos que todos los procesos
    // tengan su orden Normal 
    .pre('save', ajustarPropiedadOrden)



module.exports = mongoose.model('FamiliaDeProcesos', familiaDeProcesosSchema);