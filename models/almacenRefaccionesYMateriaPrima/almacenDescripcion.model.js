var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var AlmacenDescripcion = new Schema({
    nombre: { type: String, required: [true, 'El nombre es necesario.'] },
    ubicacion: { type: String }
}, { collection: 'almacenesDescripcion' });





module.exports = mongoose.model('AlmacenDescripcion', AlmacenDescripcion);