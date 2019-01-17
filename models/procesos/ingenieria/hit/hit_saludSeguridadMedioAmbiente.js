var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var verficaciones = new Schema({

    orden: { type: Number },
    paso: { type: String, required: [true, 'Es necesario que definas este paso.'] },
    imagenes: [{ type: String }],


}, { timeStamp: true });


module.exports = verficaciones;