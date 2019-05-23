var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var ProveedoSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es un valor obligatorio'] },
    razonSocial: { type: String },
    domicilioCompleto: { type: String, required: [true, 'El domicilio es obligatorio.'] },
    maps: { type: String },
    quienesAtienden: [{
        nombre: { type: String },
        telefono: { type: String },
        correo: { type: String },
        puesto: { type: String },
    }],
    tiempoDeEntrega: { type: Date },
    divisa: [{
        type: Schema.Types.ObjectId,
        ref: 'Divisa',
    }, ],
    // Esto de aqui es para que mongose no escriba hospitals en vez de hospitales
}, { collection: 'proveedores' });





module.exports = mongoose.model('Proveedor', ProveedoSchema);