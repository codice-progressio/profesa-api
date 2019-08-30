var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var buratoSchema = new Schema( {
    guardar: { type: Boolean, default: true },
    trabajando: { type: Boolean },

    peso10Botones: {
      type: Number,
      required: [
        //   Este required tiene que comprobarse de esta manera
        // para que cunado se guarde la ubicacion actual no lo
        // valide y permita que no se guarden los deptos como
        // este que no deben de ir.
        () => {
          return this.guardar
        },
        "El peso de 10 botones es necesario"
      ]
    },
    pesoTotalBoton: {
      type: Number,
      required: [
        () => {
          return this.guardar
        },
        "El espesor del botón es necesario"
      ]
    },
    cantidad: {
      type: Number,
      required: [
        () => {
          return this.guardar
        },
        "La cantidad de botón es necesaria"
      ]
    }
  }, { timestamps: true });

module.exports = buratoSchema;