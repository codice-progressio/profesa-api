var mongoose = require("mongoose")
var Schema = mongoose.Schema


var HistorialDeEventosSchema = new Schema({
   
  fechaDeRegistroDeEvento: Date,
  evento: require('./eventosRH.model.js')
})

module.exports = HistorialDeEventosSchema
