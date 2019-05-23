var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var DivisaSchema = new Schema({
    nombre: { type: String },


}, { collection: 'Divisas' });





module.exports = mongoose.model('Divisa', DivisaSchema);