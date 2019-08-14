var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var DivisaSchema = new Schema({
    nombre: { type: String },
    tipoDeCambio: { type: Number },
    ultimaActualizacion: { type: Date, default: Date.now },
}, { collection: 'Divisas' });





module.exports = mongoose.model('Divisa', DivisaSchema);