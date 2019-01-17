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
});

defaultsSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });

console.log(colores.danger('BORRANDO IDS') + 'Se van a eliminar los datos por defualt anteriores.');
defaultsSchema.pre('save', function(next) {
    var schema = mongoose.model('Defaults', defaultsSchema);
    schema.remove({}).then(resp => {
            console.log(colores.success('BORRADO') + 'Se limpio la base exitosamente.');
            next();
        })
        .catch(err => {
            throw new Error(err);
        });
});


module.exports = mongoose.model('Defaults', defaultsSchema);