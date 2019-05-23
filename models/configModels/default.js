var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var colores = require('../../utils/colors');

var Schema = mongoose.Schema;

var defaultsSchema = new Schema({

    SUPER_ADMIN: {
        type: Schema.Types.Mixed,
        required: [true, 'Es necesario definir el super admin..']
    },
    DEPARTAMENTOS: {
        type: Schema.Types.Mixed,
        required: [true, 'Es necesario definir los departamentos.']
    },
    PROCESOS: {
        type: Schema.Types.Mixed,
        required: [true, 'Es necesario definir los procesos.']
    },

    ACTUALIZACIONES: {
        type: Schema.Types.Mixed
    }
});

defaultsSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });



module.exports = mongoose.model('Defaults', defaultsSchema);