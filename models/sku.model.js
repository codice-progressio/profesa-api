const mongoose = require("mongoose")
const Schema = mongoose.Schema
const loteSchema = require("./almacenProductoTerminado/lote")

const sku = new Schema({
  puedoProducirlo: { type: Boolean, default: false },
  puedoComprarlo: { type: Boolean, default: false },
  puedoVenderlo: { type: Boolean, default: false },

  produccion: {
    // True cuando se desea generar medias órdenes
    // por defecto.
    medias: { type: Boolean, default: false },
    //La familia de procesos es una agrupación de todos los procesos que conlleva este sku cuando se produce. .
    familiaDeProcesos: {
      type: Schema.Types.ObjectId,
      ref: "FamiliaDeProcesos",
    },

    bom: [
      {
        material: String,
        factor: { type: Number, min: [0, "El mínimo es 0"] },
      },
    ],
  },

  detalles: {
    unidad: String,
    descripcion: String,
    imagenes: [String],
  },

  nombreCompleto: { type: String },
  porcentajeDeMerma: {
    type: Number,
    default: 2,
    min: [0, "Tiene que ser 0 o mayor que 0."],
    max: [100, "El valor máximo permitido es 100."],
  },
  // Para calcular la materia prima.
  espesor: {
    type: Number,
    min: [0.01, "El espesor mínimo debe ser 0.01"],
  },

  /**
   * La existencia de sku en el almacen.
   * Esta se actualiza automaticamente cuando se
   * se guarda la salida de sku o entra un nuevo lote.
   */
  existencia: { type: Number },

  /**
   * Los lotes de este sku. Ver schema para mas info.
   */
  lotes: [loteSchema],

  // Valores para las existencias.
  stockMinimo: { type: Number, default: 0, min: 0 },
  stockMaximo: {
    type: Number,
    default: 0,
    valildate: [
      {
        validator: function (v) {
          return new Promise(resolve => {
            resolve(this.stockMinimo >= v)
          })
        },
        msg:
          "El valor maximo de stock no puede ser menor que el valor minimo de stock",
      },
    ],
  },
  // Define la clasificación en importancia para los procesos que son
  // productivos.
  // A: Son aquellos que tienen mayor movimiento.
  // B: Movimento lento, pero constante.
  // C: Sin movimento
  // D: Descontinuados
  parte: { type: String, default: "C", enum: ["A", "B", "C", "D"] },
})

module.exports = mongoose.model("sku", sku)
