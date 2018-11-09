var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var procesoSchema = require('./procesos/proceso');
var Folio = require('../models/folios/folio');

var colores = require('../utils/colors');

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
    laserAlmacen: { type: Schema.Types.ObjectId, ref: 'MarcaLaser' },
    // Las versiones posibles de un modelo para no perder la nomenclatura anterior. 
    versionModelo: { type: Schema.Types.ObjectId, ref: 'VersionModelo' },

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
    // OrdenDeEjecucion-3 Proceso espe1  3.1
    // OrdenDeEjecucion-3 Proceso espe2  3.2
    // OrdenDeEjecucion-4 Proceso normal 4

    // Cuando se modifica la familia de modelos estos quedan huerfanos.
    // De manera que se si existe el proceso dentro del órden que tienen
    // Se acomodan solos, si no, se van a su posición correspondiente por ejemplo:
    // OrdenDeEjecucion-1 Proceso normal 1
    // OrdenDeEjecucion-3 Proceso espe1  3.1
    // OrdenDeEjecucion-3 Proceso espe2  3.2


    procesosEspeciales: [{
        proceso: {
            type: Schema.Types.ObjectId,
            ref: 'Proceso',
            required: [true, "El proceso es necesario."]
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


modeloCompletoSchema.pre('remove', function(next) {
    console.log('Estamos eliminando cualquier cosa relacionada con los modelos completos a excepción de sus partes.');
    var folios = Folio.find({ 'folioLineas.modeloCompleto': this._id }).exec();
    folios.then(fols => {
        fols.forEach(folio => {
            folio.folioLineas = folio.folioLineas.filter(x => x.modeloCompleto !== this._id);
            folio.save();
        });
        console.log('Algo se removio');

        next();
    }).then(err => {
        console.log(colores.danger('ERROR EN MIDDLEWARE=>') + err);
        throw new Error(err);
    });
});







module.exports = mongoose.model('ModeloCompleto', modeloCompletoSchema);