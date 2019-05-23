var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var productoTerminadoSchema = new Schema({

    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean, default: false },

    terminada: { type: Boolean, required: [() => { return this.guardar; }, 'Es necesario definir si la orden esta terminada.'] }

}, { timestamps: true });

module.exports = productoTerminadoSchema;