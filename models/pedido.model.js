var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var uniqueValidator = require("mongoose-unique-validator");
var AutoIncrement = require("mongoose-sequence")(mongoose);


const ArticuloPedidoSchema = {
  cantidad: Number,
  //Si aplica, se usa de lista de precio,
  precio: Number,
  sku: String,
  observaciones: String,
  importe: Number,
};

var Esquema = new Schema(
  {

    folio_interno: Number,
    eliminado: {type: Boolean, default: false},
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


Esquema.plugin(AutoIncrement, {
  id: "folio_interno_seq",
  inc_field: "folio_interno"
})


Esquema.plugin(uniqueValidator, {
  message: "El campo '{PATH}' debe ser único.",
});

module.exports = mongoose.model("Pedido", Esquema);
