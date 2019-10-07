var mongoose = require("mongoose")
var Schema = mongoose.Schema

var ImagenesFacturas = new Schema({
    imagen: String,
    fecha: Date
})

module.exports = ImagenesFacturas
