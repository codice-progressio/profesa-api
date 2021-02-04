const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose)
const Schema = mongoose.Schema
const PedidoSchema = new Schema(
  {
    _id: Number,
    eliminado: { type: Boolean, default: false },
    contacto: {
      ref: "Contacto",
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Debes especificar el contacto"],
    },
    usuario: String,

    articulos: [
      {
        cantidad: Number,
        sku: {
          ref: "sku",
          type: mongoose.Schema.Types.ObjectId,
        },
        observaciones: String,
      },
    ],

    // El inidce del array donde se encuentra
    ubicacionActual: { type: Number, select: false },

    localizacion: {
      select: false,
      type: [
        {
          departamento: String,
          entrada: { type: Date, default: Date.now },
          salida: Date,
          data: {},
          comentarios: [
            {
              comentario: String,
              createdAt: { type: Date, default: Date.now },
              usuario: String,
            },
          ],
        },
      ],
    },

    observaciones: String,
    acciones: {
      type: [
        {
          accion: String,
          usuario: String,
          createdAt: { type: Date, default: Date.now },
          estadoDocumento: {},
        },
      ],
      select: false,
    },
  },
  { _id: false, timestamps: true }
)
PedidoSchema.plugin(AutoIncrement)
module.exports = mongoose.model("pedido", PedidoSchema)
