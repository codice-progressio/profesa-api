var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var uniqueValidator = require("mongoose-unique-validator");

const ArticuloPedidoSchema = {
  cantidad: Number,
  //Si aplica, se usa de lista de precio,
  precio: Number,
  sku: String,
  observaciones: String,
  importe: Number,
};

var Schema = new Schema(
  {
    eliminado: Boolean,
    contacto: String,
    usuario: String,
    articulos: [ArticuloPedidoSchema],
    observaciones: String,
    listaDePreciosId: String,
    total: Number,
    iva: Number,

    importe: Number,
    folio: String, //Usuario +  fecha + hora
    ubicacion: {
      latitud: Number,
      longitud: Number,
    },

    sincronizado: { type: Boolean, default: true },
  },
  { collection: "pedidos", timestamps: true }
);

Schema.plugin(uniqueValidator, {
  message: "El campo '{PATH}' debe ser único.",
});

module.exports = mongoose.model("Pedido", Schema);
