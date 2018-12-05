var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var marcaLaserSchema = new Schema({
    laser: { type: String },
    imagenes: [{ type: String }],


    // Esto de aqui es para que mongose no escriba
    //  marcaLasers en vez de marcaLaseres
}, { collection: 'marcasLaser' });

module.exports = marcaLaserSchema;