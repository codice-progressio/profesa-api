var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var nombreAnteriorMaquinaShchema = new Schema({
    nombre: { type: String },
    clave: { type: String },
    createAt: { type: Date }
}, { _id: false });

module.export = nombreAnteriorMaquinaShchema;