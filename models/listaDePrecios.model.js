const mongoose = require("mongoose")

const Schema = mongoose.Schema

const ListaDePrecios = new Schema(
  {
    nombre: {
      require: [true, "Debes definir el nombre de la lista"],
      type: String,
      trim: true,
      index: {
        unique: true,
        partialFilterExpression: { nombre: { $type: "string" } },
      },
    },
    skus: [
      {
        sku: {
          ref: "sku",
          type: mongoose.Types.ObjectId,
        },
        precio: { type: Number, min: [0, "El precio minimo es 0"] },
      },
    ],
    iva: { type: Number, default: 0, min: 0 },
    descripcion: String,
  },
  { timeStamp: true, collection: "listaDePrecios" }
)

module.exports = mongoose.model("ListaDePrecios", ListaDePrecios)
