const mongoose = require("mongoose")

const Schema = mongoose.Schema

const ListaDePrecios = new Schema(
  {
    nombre: String,
    skus: [
      {
        sku: { type: String },
        precio: Number,
      },
    ],
    iva: { type: Number, default: 0, min: 0 },
    descripcion: String,
  },
  { timeStamp: true, collection: "listaDePrecios" }
)

module.exports = mongoose.model("ListaDePrecios", ListaDePrecios)
