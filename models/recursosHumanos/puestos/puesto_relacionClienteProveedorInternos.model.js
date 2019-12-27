const mongoose = require("mongoose")
const Schema = mongoose.Schema

const relacionClienteProveedorInternos_puesto = new Schema({
    departamento: {
      type: Schema.Types.ObjectId,
      ref: "Departamento"
    },
    relacion: String,
    asunto: String
  })

module.exports = relacionClienteProveedorInternos_puesto
