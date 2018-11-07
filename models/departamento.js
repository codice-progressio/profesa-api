var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var departamentoSchema = new Schema({
    nombre: { type: String, unique: true, required: [true, 'El nombre del departamento es necesario.'] },
});
departamentoSchema.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });
module.exports = mongoose.model('Departamento', departamentoSchema);