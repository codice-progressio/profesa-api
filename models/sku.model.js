const mongoose = require("mongoose")
const Schema = mongoose.Schema
const loteSchema = require("./almacenProductoTerminado/lote.model")

const sku = new Schema({
  puedoProducirlo: { type: Boolean, default: false },
  puedoComprarlo: { type: Boolean, default: false },
  puedoVenderlo: { type: Boolean, default: false },

  produccion: {
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

  unidad: String,
  descripcion: String,
  imagenes: [
    {
      nombreOriginal: String,
      nombreBD: String,
      path: String,
    },
  ],

  nombreCompleto: {
    type: String,
    unique: [true, "{{PATH}} Debe ser único"],
    minlength: 4,
  },

  /**
   * La existencia de sku en el almacen.
   * Esta se actualiza automaticamente cuando se
   * se guarda la salida de sku o entra un nuevo lote.
   */
  existencia: { type: Number, default: 0 },

  // La suma de la existencia de los almacenes
  // tomando en cuenta los que esten divididos entre
  // lotes diferentes.
  existenciaAlmacenes: {},

  /**
   * Los lotes de este sku. Ver schema para mas info.
   */
  lotes: {
    type: [loteSchema],
    select: false,
  },

  proveedores: {
    select: false,
    type: [
      {
        idProveedor: String,
        costo: { type: Number, min: 0 },
      },
    ],
  },

  // Valores para las existencias.
  stockMinimo: { type: Number, default: 0, min: 0 },
  stockMaximo: {
    type: Number,
    default: 0,
    valildate: [
      {
        validator: function (v) {
          return new Promise(resolve => {
            // Puede definirse como maximo 0 para que no se gestione
            resolve(this.stockMinimo >= v)
          })
        },
        msg:
          "El valor maximo de stock no puede ser menor que el valor minimo de stock",
      },
    ],
  },
  etiquetas: [
    {
      type: String,
      minlength: [4, "La etiqueta debe contener por lo menos 4 caracteres"],
    },
  ],
})

module.exports = mongoose.model("sku", sku)
