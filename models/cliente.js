var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var clienteSchema = new Schema({
    sae: { type: String },
    nombre: { type: String, unique: true, required: [true, 'El	nombre	es	necesario'] },
    laserados: [{ type: Schema.Types.ObjectId, ref: 'MarcaLaser' }],
    // Esto de aqui es para que mongose no escriba hospitals en vez de hospitales
}, { collection: 'clientes' });

clienteSchema.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });


module.exports = mongoose.model('Cliente', clienteSchema);