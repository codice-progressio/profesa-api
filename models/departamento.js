var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var DepartamentoSchema = new Schema({
    nombre: { type: String, unique: true, required: [true, 'El nombre del departamento es necesario.'] },
});
DepartamentoSchema.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });


DepartamentoSchema.statics.existe = function(departamento) {
    return this.findOne({ nombre: departamento.toUpperCase() }).exec();
};


module.exports = mongoose.model('Departamento', DepartamentoSchema);