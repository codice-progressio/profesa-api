var mongoose = require("mongoose")
var Schema = mongoose.Schema
var EstatusSchema = require('./estatusRequisicion.model.js')

var HistorialDeEstatusRequisicionSchema = new Schema({
  estatus: EstatusSchema,
  fechaModificacion: {type: Date, default: Date.now},
  razonDeCambio: String,
  usuarioQueModifica: {
    type: Schema.Types.ObjectId,
    ref: "Usuario",
    required: [true, "El usuario es necesario"]
  }
})

module.exports =  HistorialDeEstatusRequisicionSchema
