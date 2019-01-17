var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var secuenciaDeOperaciones = new Schema({

    orden: { type: Number, required: [true, 'No has definido el orden de este paso. '] },
    paso: { type: String, required: [true, 'Es necesario que definas este paso.'] },
    imagenes: [{ type: String }],


}, { timeStamp: true });


module.exports = secuenciaDeOperaciones;