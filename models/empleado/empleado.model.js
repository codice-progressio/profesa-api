var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var EmpleadoSchema = new Schema({
    nombres: { type: String },
    apellidoPaterno: { type: String },
    apellidoMaterno: { type: String },
    sexo: { type: Boolean },
    fechaDeNacimiento: { type: Date },
    numero: { type: Date },
    fechaDeAlta: { type: Date },
}, { collection: 'empleados' });





module.exports = mongoose.model('Empleado', EmpleadoSchema);