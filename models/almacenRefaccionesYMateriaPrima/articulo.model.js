var mongoose = require("mongoose")

var Schema = mongoose.Schema

var ProveedorRelacion = require("./proveedorRelacion.model")
var SalidaMateriaPrimaYRefacciones = require("./salidaMateriaPrimaYRefacciones.model")
var EntradaMateriaPrimaYRefacciones = require("./entradaMateriaPrimaYRefacciones.model")

var ArticuloSchema = new Schema(
  {
    codigoLocalizacion: { type: String },
    codigoInterno: { type: String },
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

    proveedores: [ProveedorRelacion],

    existencia: Number,

    salidas: [SalidaMateriaPrimaYRefacciones],
    entradas: [EntradaMateriaPrimaYRefacciones]
  },

  { collection: "articulos" }
)

module.exports = mongoose.model("Articulo", ArticuloSchema)
