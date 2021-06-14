const mongoose = require("mongoose")
const Schema = mongoose.Schema

const NotaSchema = new Schema(
  {
    consecutivo: Number,
    usuario: { type: String, required: [true, "No se recibio al usuario"] },
    articulos: [
      {
        idSku: String,
        cantidad: Number,
        // Obtener primero desde el sku
        precio: Number,
        precioActual: Number,
      },
    ],

    total: Number,
  },
  { timestamps: true }
)

module.exports = mongoose.model("remision", NotaSchema)

var CounterSchema = Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
})
var counter = mongoose.model("counter", CounterSchema)

NotaSchema.pre("save", function (next) {
  counter
    .findByIdAndUpdate({ _id: "notas" }, { $inc: { seq: 1 } })
    .exec()
    .then(counter => {
      this.consecutivo = counter.seq
      next()
    })
    .catch(_ => next(_))
})
