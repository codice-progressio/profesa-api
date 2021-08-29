var mongoose = require("mongoose")

var Schema = mongoose.Schema

var DomicilioSchema = new Schema(
  {
        calle: String, 
        numeroInterior: String,
        numeroExterior: String,
        colonia: String, 
        codigoPostal: String, 
        estado: String, 
        pais: String, 
        ciudad: String, 
        urlMaps: String
  },
)

module.exports =  DomicilioSchema
