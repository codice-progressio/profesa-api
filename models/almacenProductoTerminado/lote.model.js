const mongoose = require("mongoose")

const Schema = mongoose.Schema

/**
 * Almacen un lote con las diferentes cantidades de salida y
 * de entrada. Lo importante del manejo de lotes es que se sepa la cantidad
 * de boton que resta de uno y de otro para que se entreguen cantidades por lote.
 *
 */
const LoteSchema = new Schema({
  existencia: { type: Number, default: 0 },
  /**
   * La cantidad del lote que entro.
   */
  movimientos: [
    {
      cantidad: Number,
      // true entrada, false salida.
      esEntrada: { type: Boolean, default: false },
      observaciones: String,
    },
  ],
  createAt: { type: Date, default: Date.now },
})

module.exports = LoteSchema
