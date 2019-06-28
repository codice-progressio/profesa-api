var mongoose = require("mongoose")

var Schema = mongoose.Schema

var SalidaArticulo = new Schema({
  fecha: { type: Date, default: Date.now},
  cantidad: {type: Number, min: [0, 'La cantidad no puede ser menor que 0']},
  departamento: {
    type: Schema.Types.ObjectId,
    ref: "Departamento",
    require: [true, "El departamento es obligatorio"]
  },
  observaciones: String
  // quienSolicita: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Empleado",
  //   require: [true, "Es necesario definir quien solicita"]
  // },
  // quienSurte: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Usuario",
  //   require: [true, "Es necesario definir quien surte"]
  // }
})

module.exports = SalidaArticulo



