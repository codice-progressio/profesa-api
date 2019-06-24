var mongoose = require("mongoose")

var Schema = mongoose.Schema

let uniqueValidator = require("mongoose-unique-validator")

var SalidaMateriaPrimaYRefacciones = require("./salidaMateriaPrimaYRefacciones.model")
var EntradaMateriaPrimaYRefacciones = require("./entradaMateriaPrimaYRefacciones.model")

var ArticuloSchema = new Schema(
  {
    codigoLocalizacion: { type: String, unique: true },
    codigoInterno: { type: String },
    codigoProveedor: { type: String },
    almacen: {
      type: Schema.Types.ObjectId,
      ref: "AlmacenDescripcion",
      required: [true, "Es necesario definir el almacen."]
    },

    nombre: {
      type: String,
      required: [true, "Es necesario que definas el nombre de este articulo."]
    },

    descripcion: String,
    presentacion: {
      type: String,
      required: [
        true,
        "Es necesario que definas la presentacion de este producto."
      ]
    },
    unidad: {
      type: String,
      required: [true, "La unidad de medida de la presentacion es necesaria."]
    },
    kgPorUnidad: {
      type: Number,
      min: [0, "El valor minimo permitido es 0."],
      required: [true, "Es necesario que definas los kg por unidad."]
    },

    // var ProveedorRelacion = require("./proveedorRelacion.model")
    // proveedores: [ProveedorRelacion],

    existencia: {type: Number, default: 0},

    salidas: [SalidaMateriaPrimaYRefacciones],
    entradas: [EntradaMateriaPrimaYRefacciones]
  },

  { collection: "articulos" }
)

ArticuloSchema.plugin(uniqueValidator, { message: "'{PATH}' debe ser único." })

module.exports = mongoose.model("Articulo", ArticuloSchema)
