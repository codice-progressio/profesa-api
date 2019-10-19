var mongoose = require("mongoose")
var Schema = mongoose.Schema

//OJO!!!!! TODOS LOS EVENTOS QUE SE AGREGUEN
// DEBEN SER CON UNSHIFT!!! NO PUSH!!
var HistorialDeEventosSchema = new Schema({
   
  fechaDeRegistroDeEvento: Date,
  evento: require('./eventosRH.model.js')
})

module.exports = HistorialDeEventosSchema
