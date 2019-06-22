var mongoose = require('mongoose');
var Schema = mongoose.Schema;


const ProveedorRelacionSchema = new Schema({
    proveedor: {
      type: Schema.Types.ObjectId,
      ref: "Proveedor",
      require: [true, "El proveedor es necesario."]
    },
    precio: {
      type: Number,
      require: [true, "Es necesario que definas el precio"]
    },
    // Esta divisa la debe de contener el proveedor.
    divisa: {
      type: Schema.Types.ObjectId,
      ref: "Divsa",
      require: [true, "La moneda es necesaria."]
    },

    tiempoDeEntregaEnDias: {
        type: Number
    }

})
  

module.exports = ProveedorRelacionSchema