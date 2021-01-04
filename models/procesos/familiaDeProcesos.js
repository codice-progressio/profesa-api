let mongoose = require("mongoose")
let Schema = mongoose.Schema
var sku = require("../sku.model")

let familiaDeProcesosSchema = new Schema({
  procesos: [
    {
      proceso: {
        type: Schema.Types.ObjectId,
        ref: "Proceso",
        required: [true, "El proceso es necesario."],
      },
      // TODO: Debe mantener integridad y usar un solo schema. Ver notda de Modelo completo.
      orden: { type: Number },
      // Copia del interior de: Boolean, required: [true, 'Debes definir si este proceso requiere ser transformado para poder realizarse.'] }
    },
  ],
  nombre: { type: String, required: [true, "El nombre es requerido."] },
  // Familias que requieren que el producto este terminado para poderse asignar.
  soloParaProductoTerminado: { type: Boolean, default: false },
  observaciones: String,
})

module.exports = mongoose.model("FamiliaDeProcesos", familiaDeProcesosSchema)
