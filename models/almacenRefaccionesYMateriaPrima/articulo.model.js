var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var ArticuloSchema = new Schema({
    codigoLocalizacion: { type: String },
    codigoInterno: { type: String },
    almacen: {
        type: Schema.Types.ObjectId,
        ref: 'AlmacenDescripcion',
        required: [true, 'Es necesario definir el almacen.']
    },

    descripcion: String,
    proveedores = [{
        proveedor: {
            type: Schema.Types.ObjectId,
            ref: 'Proveedor',
            require: [true, 'El proveedor es necesario.']
        },
        precio: { type: Number, require: [true, 'Es necesario que definas el precio'] },
        // Esta divisa la debe de contener el proveedor. 
        divisa: {
            type: Schema.Types.ObjectId,
            ref: 'Divsa',
            require: [true, 'La moneda es necesaria.']
        }
    }],
    existencia: {
        total: Number,
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