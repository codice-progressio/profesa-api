var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pasoSchema = new Schema({
    orden: { type: Number, required: [true, 'Es necesario definir el órden.'] },
    descripcion: { type: String, required: [true, 'Es necesario describir el paso. '] }
});

module.exports = pasoSchema;