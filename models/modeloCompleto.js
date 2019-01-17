var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var procesoSchema = require('./procesos/proceso');
var Folio = require('../models/folios/folio');
var Cliente = require('../models/cliente');

var Modelo = require('../models/modelo');
var Tamano = require('../models/tamano');
var Color = require('../models/colores/color');
var Terminado = require('../models/terminado');


var colores = require('../utils/colors');

var marcaLaser = require('../models/marcaLaser');

var modeloCompletoSchema = new Schema({
    // True cuando se desea generar medias órdenes
    // por defecto. 
    medias: { type: Boolean, default: false },

    modelo: {
        type: Schema.Types.ObjectId,
        ref: 'Modelo',
        required: [true, "El modelo es necesario."]
    },
    tamano: {
        type: Schema.Types.ObjectId,
        ref: 'Tamano',
        required: [true, "El tamano es necesario."]
    },
    color: {
        type: Schema.Types.ObjectId,
        ref: 'Color',
        required: [true, "El color es necesario."]
    },
    terminado: {
        type: Schema.Types.ObjectId,
        ref: 'Terminado',
        required: [true, "El terminado es necesario."]
    },


    // Hay algúnos modelos que llevan marcaLaser desde que se fabrican. 
    laserAlmacen: marcaLaser,
    // Las versiones posibles de un modelo para no perder la nomenclatura anterior. 
    versionModelo: { type: String },

    //La familia de procesos es una agrupación de todos los procesos que conlleva
    // este modelo. 
    familiaDeProcesos: {
        type: Schema.Types.ObjectId,
        ref: 'FamiliaDeProcesos',
        required: [true, "Es necesario que definas la familia de procesos."]
    },

    // Los procesos especiales son acciones especiales para dicho modelo y pueden 
    // intervenir dentro de los procesos de la familia de procesos para que
    // se ejecuten en el órden deseado de manera que sean reacomodados. Ejemplo:
    // OrdenDeEjecucion-1 Proceso normal 1
    // OrdenDeEjecucion-2 Proceso normal 2
    // OrdenDeEjecucion-3 Proceso normal 3
    // OrdenDeEjecucion-3 Proceso extra1  3.1
    // OrdenDeEjecucion-3 Proceso extra2  3.2
    // OrdenDeEjecucion-4 Proceso normal 4

    // Cuando se modifica la familia de modelos estos quedan huerfanos.
    // De manera que se si existe el proceso dentro del órden que tienen
    // Se acomodan solos, si no, se van a su posición correspondiente por ejemplo:
    // OrdenDeEjecucion-1 Proceso normal 1
    // OrdenDeEjecucion-3 Proceso extra1  3.1
    // OrdenDeEjecucion-3 Proceso extra2  3.2


    procesosEspeciales: [{
        proceso: {
            type: Schema.Types.ObjectId,
            ref: 'Proceso',
            required: [true, "El proceso es necesario."]
        },
        procesoPadre: {
            type: Schema.Types.ObjectId,
            ref: 'Proceso',
        },
        // TODO: Aqui debe de ir el proces del que viene para facilitar el óren y mantener integridad de datos. 
        orden: { type: Number }
    }],

    nombreCompleto: { type: String },
    porcentajeDeMerma: { type: Number, default: 2, min: [0, 'Tiene que ser 0 o mayor que 0.'], max: [100, 'El valor máximo permitido es 100.'] },
    // Para calcular la materia prima. 
    espesor: {
        type: Number,
        min: [0.01, 'El espesor mínimo debe ser 0.01']
    },



}, { collection: 'modelosCompletos' });


let generarNombreCompleto = function(next) {
    // Obtenemos los id. 

    console.log('Entro aqui: Generar nombre completo');


    Promise.all([
            Modelo.findById(this.modelo).exec(),
            Tamano.findById(this.tamano).exec(),
            Color.findById(this.color).exec(),
            Terminado.findById(this.terminado).exec()
        ]).then(resp => {
            let modelo = resp[0];
            let tamano = resp[1];
            let color = resp[2];
            let terminado = resp[3];

            this.nombreCompleto = `${modelo.modelo}-${tamano.tamano}-${color.color}-${terminado.terminado}`;
            this.nombreCompleto += this.laserAlmacen ? '-' + this.laserAlmacen.laser : '';
            this.nombreCompleto += this.versionModelo ? '-' + this.versionModelo : '';

            console.log(` Paso por aqui ${JSON.stringify(this)}`);
            next();

        })
        .catch(err => {
            console.log(`${colores.danger('ERROR')}  Hubo un error guardando el nombre completo: ${err}`);
            throw err;
        });

};






var autoPopulate = function(next) {

    console.log('Entro aqui autopopulate');

    this.populate('modelo', 'modelo', null, { sort: { modelo: -1 } });
    this.populate('tamano', 'tamano estandar', null, { sort: { tamano: -1 } });
    this.populate('color', 'color', null, { sort: { color: -1 } });
    this.populate('terminado', 'terminado', null, { sort: { terminado: -1 } });
    this.populate({
        path: 'familiaDeProcesos',
        populate: {
            path: 'procesos.proceso',
            populate: {
                path: 'maquinas  departamento'
            }
        }
    });
    this.populate({
        path: 'procesosEspeciales.proceso',
        populate: {
            path: 'maquinas  departamento'
        }
    });
    next();
};




/**
 * Elimina los pedidos, clientes, modelosCompletos y el elemento en si
 * del id que se le pase como parametro y sus relaciones. 
 * 
 * Esta funcion solo se debe ejecutar desde los hooks. 
 *
 * @param {*} IDElemento El id del elemento que se quiere eliminar. (Modelo, tamano, color, terminado)
 * @param {*} campo El nombre del campo en donde se buscara el id del elemento para los modelos completos. 
 * @param {*} next Para continuar con la ejecucion del pre. 
 */
modeloCompletoSchema.statics.eliminarRelacionados = function(IDElemento, campo, next) {

    // El id del modelo, tamano, color o termiando a eliminar.
    var idElemento = IDElemento;

    // Eliminar los mc que tengan este modelo. 
    const mcIDs = [];

    // Buscamos los id que correspondan e los modelos
    // Que tengan ese id. 
    this.find({
            [campo]: idElemento
        }).exec()
        .then(mcCoincidentes => {

            // Obtenemos el id de los modelosCompletos que coinciden. 
            mcCoincidentes.forEach(mc => {
                // Los guardamos en el array para luego utilizarlos. 
                mcIDs.push(mc._id);
            });

            // Las promesas que van a eliminar los datos. 
            var promesas = [];

            // Las condiciones para eliminar elementos de los arreglos. 
            var eliC = { $pull: { modelosCompletosAutorizados: { modeloCompleto: { $in: mcIDs } } } };
            var eliF = { $pull: { folioLineas: { modeloCompleto: { $in: mcIDs } } } };


            // Eliminamos los clientes relacionados con este modeloCompleto. 
            promesas.push(eliminarModelosCompletosAutorizadosDeClientesRelacionados(mcIDs, eliC));
            // Eliminamos los pedidos relacionados con este modeloCompleto. 
            // promesas.push(Folio.update({ 'folioLineas.modeloCompleto': { $in: mcIDs } }, eliF).exec());
            promesas.push(eliminarPedidosRelacionados(mcIDs, eliF));
            // Eliminamos los modelos completos relacionados con este elemento que se va a eliminar.  
            promesas.push(this.deleteMany({ _id: { $in: mcIDs } }).exec());

            return Promise.all(promesas);

        }).then(resp => {
            console.log(`${colores.success('CORRECTO')}  Datos relacionados eliminados ${JSON.stringify(resp)}`);
            next();
        })
        .catch(err => {
            console.log(`${colores.danger('ERROR')}  Hubo un error eliminando los datos relacionados: ${err}`);
            throw err;
        });


};

/**
 *Busca y elimina los pedidos que esten relacionados con el id del modelo completo que se le
 pase como parametro. Debe ser un arreglo de id de modelo completo. 
 *
 * @param {*} mcIDs [Arreglo] ids de modelo completo. 
 * @param {*} eliF El objeto pull parra eliminar: { $pull: { folioLineas: { modeloCompleto: { $in: [this._id] } } } }
 * @returns El query para hacer el then. 
 */
function eliminarPedidosRelacionados(mcIDs, eliF) {
    return Folio.update({ 'folioLineas.modeloCompleto': { $in: mcIDs } }, eliF).exec();
}

/**
 *Busca y elimina los modelosCompletosAutorizados relacionados con el id del modeloCompleto que se le pase como
 parametro. Deber ser un arreglo de id de modeloCompleto.
 *
 * @param {*} mcIDs [Arreglo] ids de modelo completo. 
 * @param {*} eliC El objeto pull parra eliminr { $pull: { modelosCompletosAutorizados: { modeloCompleto: { $in: [this._id] } } } }
 * @returns El query para hacer el then.
 */
function eliminarModelosCompletosAutorizadosDeClientesRelacionados(mcIDs, eliC) {
    return Cliente.update({ 'modelosCompletosAutorizados.modeloCompleto': { $in: mcIDs } }, eliC).exec();
}


/**
 * Busca todos los folios que contengan pedidos con este modelo y los elimina del 
 * folio.
 *
 * @param {*} next
 */
let eliminarLineasDeFoliosRelacionadas = function(next) {
    console.log('Estamos eliminando cualquier cosa relacionada con los modelos completos a excepción de sus partes.');
    Promise.all([
            eliminarPedidosRelacionados([this._id], { $pull: { folioLineas: { modeloCompleto: { $in: [this._id] } } } }),
            eliminarModelosCompletosAutorizadosDeClientesRelacionados([this._id], { $pull: { modelosCompletosAutorizados: { modeloCompleto: { $in: [this._id] } } } }),
        ])
        .then(resp => {
            console.log(colores.info('DATOS ELIMINADOS') + 'Se eliminaron los datos modelo autorizado para el cliente y pedidos existentes relacionados con este modelo:' + this.nombreCompleto)
            next();
        }).catch(err => {
            console.log(colores.danger('ERROR EN MIDDLEWARE=>') + err);
            throw new Error(err);
        });
};




// El orden de es importante sobre todo cuando son el mismo hook. 

modeloCompletoSchema
    .pre('findOne', autoPopulate)
    .pre('find', autoPopulate)
    // Este orden de save es importante. 
    .pre('save', autoPopulate)
    .pre('save', generarNombreCompleto)
    .pre('remove', eliminarLineasDeFoliosRelacionadas);


module.exports = mongoose.model('ModeloCompleto', modeloCompletoSchema);