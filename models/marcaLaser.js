var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var marcaLaserSchema = new Schema({

    laser: { type: String },
    imagenes: [String],


    // Esto de aqui es para que mongose no escriba
    //  marcaLasers en vez de marcaLaseres
}, { collection: 'marcasLaser' });

module.exports = marcaLaserSchema;