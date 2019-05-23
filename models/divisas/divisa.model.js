var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var DivisaSchema = new Schema({
    nombre: { type: String },
    tipoDeCambio: { type: Number },
    ultimaActualizacion: { type: Date },
    almacen: {
        type: Schema.Types.ObjectId,
        ref: 'Divisa',
    }
}, { collection: 'Divisas' });





module.exports = mongoose.model('Divisa', DivisaSchema);