var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var productoTerminadoSchema = new Schema({

    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean, default: false },

    terminada: { type: Boolean }

}, { timestamps: true });

module.exports = productoTerminadoSchema;