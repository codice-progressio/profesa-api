var mongoose = require("mongoose")

var Schema = mongoose.Schema

let uniqueValidator = require("mongoose-unique-validator")

var SalidaArticuloSchema = require("./salidaArticulo.model")
var EntradaArticuloSchema = require("./entradaArticulo.model")

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

    existencia: { type: Number, default: 0 },

    salidas: [SalidaArticuloSchema],
    entradas: [EntradaArticuloSchema],

    stockMinimo: {
      type: Number,
      min: [0, "El minimo permitido es 0."],
      default: 0
    },
    stockMaximo: {
      type: Number,

      default: 0,
      valildate: [
        {
          validator: function(v) {
            return new Promise((resolve) => {
              resolve(this.stockMinimo > v)
            })
          },
          msg:
            "El valor maximo de stock no puede ser menor que el valor minimo de stock"
        }
      ]
    }
  },

  { collection: "articulos" }
)
ArticuloSchema.plugin(uniqueValidator, { message: "'{PATH}' debe ser único." })

function autoPopulate(next) {
  this.populate("almacen")
  next()
}

ArticuloSchema.pre('find', autoPopulate)


module.exports = mongoose.model("Articulo", ArticuloSchema)
