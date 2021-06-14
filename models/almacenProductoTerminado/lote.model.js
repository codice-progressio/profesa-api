const mongoose = require("mongoose")

const Schema = mongoose.Schema

/**
 * Almacen un lote con las diferentes cantidades de salida y
 * de entrada. Lo importante del manejo de lotes es que se sepa la cantidad
 * de boton que resta de uno y de otro para que se entreguen cantidades por lote.
 *
 */
const LoteSchema = new Schema({
  existencia: {
    type: Number,
    // min: [0, "{PATH} de lote no puede ser menor que 0"],
  },
  // La existencia de cada almacen que se vaya creando.
  // Este valor es dinamico pues permite que el usuario
  // cree diferentes almacenes segun sus necesidades.
  // Se espera que la clave de este objecto sea el id
  // del almacen y solo contenga la cantidad.
  existenciaAlmacenes: {},
  observaciones: "",
  movimientos: [
    {
      cantidad: Number,
      // true entrada, false salida.
      esEntrada: { type: Boolean, default: false },
      observaciones: String,
      createdAt: { type: Date, default: Date.now },
      usuario: String, 
      almacen: String
    },
  ],
  createdAt: { type: Date, default: Date.now },
  caducidad: Date,
})

module.exports = LoteSchema
