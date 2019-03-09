var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var ArticuloSchema = new Schema({
    codigoLocalizacion: { type: String },
    codigoInterno: { type: String },
    almacen: {
        type: Schema.Types.ObjectId,
        ref: 'Proveedor',
    },

    descripcion: { type: String },
    proveedores = [{
        proveedor: {
            type: Schema.Types.ObjectId,
            ref: 'Proveedor',
        },
        precio: { type: Number },
        // Esta divisa la debe de contener el proveedor. 
        divisa: {
            type: Schema.Types.ObjectId,
            ref: 'Divsa',
        }
    }],
    existencia: {
        total: { type: Number },
        salidas: [{
            fecha: Date,
            cantidad: Number,
            departamento: {
                type: Schema.Types.ObjectId,
                ref: 'Departamento',
                require: [true, 'El departamento es obligatorio']

            },
            quienSolicita: {
                type: Schema.Types.ObjectId,
                ref: 'Empleado',
                require: [true, 'Es necesario definir quien solicita']

            },
            quienSurte: {
                type: Schema.Types.ObjectId,
                ref: 'Usuario',
                require: [true, 'Es necesario definir quien surte']
            },

        }],

    }


}, { collection: 'Divisas' });





module.exports = mongoose.model('Divisa', ArticuloSchema);