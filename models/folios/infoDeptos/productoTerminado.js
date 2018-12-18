var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var productoTerminadoSchema = new Schema({
    terminada: { type: Boolean, required: [true, 'Es necesario definir si la orden esta terminada.'] }
}, { timestamps: true });

module.exports = productoTerminadoSchema;