var mongoose = require("mongoose")

var Schema = mongoose.Schema

var SalidaMateriaPrimaYRefacciones = new Schema({
  fecha: { type: Date, default: Date.now},
  cantidad: Number,
  departamento: {
    type: Schema.Types.ObjectId,
    ref: "Departamento",
    require: [true, "El departamento es obligatorio"]
  },
  quienSolicita: {
    type: Schema.Types.ObjectId,
    ref: "Empleado",
    require: [true, "Es necesario definir quien solicita"]
  },
  quienSurte: {
    type: Schema.Types.ObjectId,
    ref: "Usuario",
    require: [true, "Es necesario definir quien surte"]
  }
})

module.exports = SalidaMateriaPrimaYRefacciones
