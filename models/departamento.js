var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
var DEPTOS = require('../config/departametosDefaults');
var colores = require('../utils/colors');

var DepartamentoSchema = new Schema({
    nombre: { type: String, unique: true, required: [true, 'El nombre del departamento es necesario.'] },
});
DepartamentoSchema.plugin(uniqueValidator, { message: 'El campo \'{PATH}\' debe ser único.' });


DepartamentoSchema.statics.existe = function(departamento) {
    return this.findOne({ nombre: departamento.toUpperCase() }).exec();
};

DepartamentoSchema.statics.obtener = function x(a) {
    // Buscamos alguna conincidencia itinerando los 
    // tres tipos de variable.
    a = a.toLowerCase();
    console.log(`${colores.info('||DEBUG|| OBTENER DEPTO DESDE SCHEMA')} Este es departamento que se va a mostrar ${a}`)
    for (const x in DEPTOS) {
        if (DEPTOS.hasOwnProperty(x)) {
            const dat = DEPTOS[x];
            if (dat._n.toLowerCase() === a) return dat;
            if (dat._v.toLowerCase() === a) return dat;
            if (dat._vm.toLowerCase() === a) return dat;
        }
    }
    return null;
}


module.exports = mongoose.model('Departamento', DepartamentoSchema);