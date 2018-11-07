var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var marcaLaserSchema = new Schema({
    laser: { type: String, unique: true },
    imagenes: [{ type: String }],


    // Esto de aqui es para que mongose no escriba
    //  marcaLasers en vez de marcaLaseres
}, { collection: 'marcasLaser' });

marcaLaserSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });
module.exports = mongoose.model('MarcaLaser', marcaLaserSchema);