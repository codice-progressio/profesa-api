var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var hospitalSchema = new Schema({
    nombre: { type: String, required: [true, 'El	nombre	es	necesario'] },
    img: { type: String, required: false },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' }
    // Esto de aqui es para que mongose no escriba hospitals en vez de hospitales
}, { collection: 'hospitales' });


module.exports = mongoose.model('Hospital', hospitalSchema);