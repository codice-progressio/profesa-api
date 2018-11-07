var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var versionModeloSchema = new Schema({
    versionModelo: { type: String, unique: true }
}, { collection: 'versionModelos' });

versionModeloSchema.plugin(uniqueValidator, { message: ' \'{PATH}\' debe ser único.' });


module.exports = mongoose.model('VersionModelo', versionModeloSchema);